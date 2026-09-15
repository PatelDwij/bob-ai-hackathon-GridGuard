import { collection, query, where, onSnapshot, doc, getDoc, setDoc, runTransaction, serverTimestamp, updateDoc } from './data-client.js';
import { db } from './firebase-config.js';
import { scoreRisk } from './risk-engine.js';

export const COLLECTIONS = ['assets', 'sensorReadings', 'predictions', 'maintenanceOrders', 'crews', 'incidents', 'weatherSnapshots'];

export function subscribeRegion(region, next, error) {
  let stopped = false;
  const state = {};
  const ready = new Set();

  const checkReady = () => {
    if (stopped) return;
    if (ready.size === COLLECTIONS.length + 1) {
      next({ ...state });
    }
  };

  const stops = COLLECTIONS.map(name => {
    return onSnapshot(
      query(collection(db, name), where('region', '==', region)),
      snapshot => {
        if (stopped) return;
        state[name] = snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
        ready.add(name);
        checkReady();
      },
      err => {
        console.warn(`Warning on collection ${name}:`, err);
        state[name] = state[name] || [];
        ready.add(name);
        checkReady();
        if (error) error(err);
      }
    );
  });

  stops.push(
    onSnapshot(
      doc(db, 'regions', region),
      snapshot => {
        if (stopped) return;
        ready.add('region');
        state.region = snapshot.exists()
          ? snapshot.data()
          : { name: region, weatherLocation: { latitude: 23, longitude: 72 } };
        checkReady();
      },
      err => {
        console.warn(`Warning on region doc ${region}:`, err);
        state.region = state.region || { name: region, weatherLocation: { latitude: 23, longitude: 72 } };
        ready.add('region');
        checkReady();
      }
    )
  );

  return () => {
    stopped = true;
    stops.forEach(stop => {
      try { stop(); } catch (e) {}
    });
  };
}

// Work Order Creation
export async function createOrder(assetId, manualPriority = null, manualSummary = null) {
  const orderRef = doc(db, 'maintenanceOrders', `WO-${assetId}`);
  return runTransaction(db, async tx => {
    const [a, p, old] = await Promise.all([
      tx.get(doc(db, 'assets', assetId)),
      tx.get(doc(db, 'predictions', assetId)),
      tx.get(orderRef)
    ]);
    if (!a.exists() || !p.exists()) throw new Error('Asset or prediction record not found.');
    if (old.exists()) throw new Error('An active work order already exists for this asset.');
    const asset = a.data(), prediction = p.data();
    tx.set(orderRef, {
      orderId: orderRef.id,
      assetId,
      region: asset.region,
      priority: manualPriority || prediction.riskLevel,
      status: 'Pending',
      summary: manualSummary || prediction.recommendedAction,
      assignedCrewId: null,
      dueAt: new Date(Date.now() + (prediction.predictionWindowHours || 24) * 3600000),
      failureRisk: prediction.failureProbability,
      gridImpact: prediction.gridImpact,
      checklist: [{ title: 'Inspection', description: prediction.recommendedAction }],
      aiReason: prediction.predictedFailureMode,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      dataSource: 'simulated'
    });
  });
}

export async function assignCrew(orderId, crewId) {
  return runTransaction(db, async tx => {
    const oref = doc(db, 'maintenanceOrders', orderId);
    const cref = doc(db, 'crews', crewId);
    const o = await tx.get(oref);
    const c = await tx.get(cref);
    if (!o.exists() || !c.exists()) throw new Error('Order or crew no longer exists.');
    const order = o.data(), crew = c.data();
    if (order.status !== 'Pending' || order.assignedCrewId) throw new Error('This order is already assigned or completed.');
    if (crew.status !== 'Ready' || crew.assignedOrderId || !crew.availability) throw new Error('Crew is no longer available.');
    if (crew.region !== order.region) throw new Error('Select a crew in the order region.');
    tx.update(oref, { assignedCrewId: crewId, status: 'Assigned', updatedAt: serverTimestamp() });
    tx.update(cref, { assignedOrderId: orderId, status: 'Assigned', availability: false, lastUpdated: serverTimestamp() });
  });
}

// Order Status Transitions
export async function changeOrderStatus(orderId, status) {
  return runTransaction(db, async tx => {
    const ref = doc(db, 'maintenanceOrders', orderId), snap = await tx.get(ref);
    if (!snap.exists()) throw new Error('Order no longer exists.');
    const order = snap.data();
    const transitions = {
      Pending: [],
      Assigned: ['In Progress', 'Completed'],
      'In Progress': ['Completed'],
      Completed: []
    };
    if (!transitions[order.status]?.includes(status)) throw new Error('Assign a crew first, then start or complete the order.');
    const cref = doc(db, 'crews', order.assignedCrewId), crew = await tx.get(cref);
    if (!crew.exists() || crew.data().assignedOrderId !== orderId) throw new Error('Crew assignment is inconsistent.');
    tx.update(ref, {
      status,
      assignedCrewId: status === 'Completed' ? null : order.assignedCrewId,
      updatedAt: serverTimestamp()
    });
    tx.update(cref, {
      status: status === 'Completed' ? 'Ready' : 'Deployed',
      availability: status === 'Completed',
      assignedOrderId: status === 'Completed' ? null : orderId,
      lastUpdated: serverTimestamp()
    });
  });
}

// Incident Creation
export async function createIncident(assetId, title, customData = {}) {
  const ref = doc(collection(db, 'incidents'));
  return runTransaction(db, async tx => {
    const snap = await tx.get(doc(db, 'assets', assetId));
    if (!snap.exists()) throw new Error('Asset does not exist.');
    const a = snap.data();
    tx.set(ref, {
      incidentId: ref.id,
      assetId,
      region: a.region,
      severity: customData.severity || a.riskLevel,
      type: customData.type || 'Operator Report',
      title: (title || customData.title || 'Operational equipment incident').trim(),
      description: (customData.description || 'SIMULATED incident created by authorized operator; requires field verification.').trim(),
      status: 'Open',
      startedAt: serverTimestamp(),
      resolvedAt: null,
      affectedLoadMW: Number(customData.affectedLoadMW) || 0,
      customersAffected: Number(customData.customersAffected) || 0,
      weatherRelated: Boolean(customData.weatherRelated),
      createdAt: serverTimestamp(),
      dataSource: 'simulated'
    });
  });
}

// Incident Status Transition
export async function changeIncidentStatus(id, status) {
  if (!['Open', 'Monitoring', 'Resolved'].includes(status)) throw new Error('Invalid incident status');
  return updateDoc(doc(db, 'incidents', id), {
    status,
    resolvedAt: status === 'Resolved' ? serverTimestamp() : null
  });
}

// Data Management: Add Asset
export async function addAsset(assetData) {
  const assetId = assetData.assetId.trim();
  const region = assetData.region.trim();
  const type = assetData.type || 'Transformer';
  const now = new Date();

  // Baseline telemetry reading to establish risk
  const reading = {
    id: `${assetId}-init`,
    assetId,
    region,
    timestamp: now,
    temperature: Number(assetData.temperature) || 52,
    oilTemperature: type === 'Transformer' ? (Number(assetData.oilTemperature) || 58) : null,
    vibration: Number(assetData.vibration) || 1.8,
    partialDischarge: Number(assetData.partialDischarge) || 45,
    oilQuality: type === 'Transformer' ? (Number(assetData.oilQuality) || 82) : null,
    loadPercentage: Number(assetData.loadPercentage) || 68,
    voltage: Number(assetData.voltage) || (type === 'Substation' ? 66000 : 11000),
    current: Number(assetData.current) || 230,
    dataSource: 'simulated'
  };

  const risk = scoreRisk(reading, 0, 15, type);

  const assetRecord = {
    id: assetId,
    assetId,
    name: assetData.name ? assetData.name.trim() : `${assetData.area || region} ${type}`,
    type,
    region,
    area: assetData.area || 'Central',
    latitude: Number(assetData.latitude) || 23.02,
    longitude: Number(assetData.longitude) || 72.57,
    healthScore: Math.round(100 - risk.riskScore * 0.65),
    riskScore: risk.riskScore,
    failureProbability: risk.failureProbability,
    riskLevel: risk.riskLevel,
    gridImpact: assetData.gridImpact || risk.gridImpact,
    status: assetData.status || 'Operational',
    installationYear: Number(assetData.installationYear) || now.getFullYear() - 5,
    manufacturer: assetData.manufacturer || 'ABB',
    lastMaintenance: now,
    nextInspection: new Date(Date.now() + risk.predictionWindowHours * 3600000),
    telemetryOnline: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    dataSource: 'simulated'
  };

  const predRecord = {
    id: assetId,
    assetId,
    region,
    ...risk,
    generatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'assets', assetId), assetRecord);
  await setDoc(doc(db, 'predictions', assetId), predRecord);
  await setDoc(doc(db, 'sensorReadings', reading.id), reading);
  return assetRecord;
}

// Data Management: Edit Asset
export async function updateAsset(assetId, updates) {
  const ref = doc(db, 'assets', assetId);
  const patch = { ...updates, updatedAt: serverTimestamp() };
  delete patch.id;
  delete patch.assetId;
  return updateDoc(ref, patch);
}

// Data Management: Ingest Telemetry / Simulated Reading
export async function addTelemetry(readingData) {
  const assetId = readingData.assetId;
  const assetSnap = await getDoc(doc(db, 'assets', assetId));
  if (!assetSnap.exists()) throw new Error(`Asset ${assetId} not found.`);
  const asset = assetSnap.data();

  const now = new Date();
  const readingId = `${assetId}-${Date.now()}`;
  const reading = {
    id: readingId,
    assetId,
    region: asset.region,
    timestamp: now,
    temperature: Number(readingData.temperature) || 55,
    oilTemperature: asset.type === 'Transformer' ? (Number(readingData.oilTemperature) || 60) : null,
    vibration: Number(readingData.vibration) || 2.0,
    partialDischarge: Number(readingData.partialDischarge) || 50,
    oilQuality: asset.type === 'Transformer' ? (Number(readingData.oilQuality) || 80) : null,
    loadPercentage: Number(readingData.loadPercentage) || 70,
    voltage: Number(readingData.voltage) || (asset.type === 'Substation' ? 66000 : 11000),
    current: Number(readingData.current) || 240,
    dataSource: 'simulated'
  };

  const risk = scoreRisk(reading, 1, 20, asset.type);
  const healthScore = Math.round(100 - risk.riskScore * 0.65);

  await setDoc(doc(db, 'sensorReadings', readingId), reading);
  await updateDoc(doc(db, 'predictions', assetId), {
    ...risk,
    generatedAt: serverTimestamp()
  });
  await updateDoc(doc(db, 'assets', assetId), {
    riskScore: risk.riskScore,
    riskLevel: risk.riskLevel,
    failureProbability: risk.failureProbability,
    healthScore,
    gridImpact: risk.gridImpact,
    updatedAt: serverTimestamp()
  });

  return { reading, risk };
}

// Data Management: Add Crew
export async function addCrew(crewData) {
  const crewId = crewData.crewId.trim();
  const region = crewData.region.trim();
  const now = new Date();

  const crew = {
    id: crewId,
    crewId,
    name: crewData.name.trim(),
    region,
    status: crewData.status || 'Ready',
    currentArea: crewData.currentArea || 'Central',
    skills: crewData.skills || ['Transformer', 'Substation', 'Circuit Breaker'],
    members: crewData.members || [
      { name: crewData.leadName || 'Lead Tech', role: 'Team Lead' },
      { name: 'Field Specialist', role: 'Technician' }
    ],
    assignedOrderId: null,
    latitude: Number(crewData.latitude) || 23.03,
    longitude: Number(crewData.longitude) || 72.58,
    availability: crewData.status !== 'Unavailable',
    lastUpdated: serverTimestamp(),
    dataSource: 'simulated'
  };

  await setDoc(doc(db, 'crews', crewId), crew);
  return crew;
}

// Data Management: Update Crew Status
export async function updateCrewStatus(crewId, status) {
  const ref = doc(db, 'crews', crewId);
  const availability = status === 'Ready';
  return updateDoc(ref, {
    status,
    availability,
    lastUpdated: serverTimestamp()
  });
}
