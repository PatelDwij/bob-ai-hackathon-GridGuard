# Problem Statement

## Background

Power utilities depend on critical infrastructure such as transformers, substations, circuit breakers, and distribution equipment. Failures in these assets can interrupt electricity supply, affect customers, increase maintenance costs, and require urgent field response.

Utilities continuously receive operational signals such as temperature, oil temperature, vibration, partial discharge, load, equipment condition, weather exposure, and incident history. The challenge is turning these signals into clear and actionable maintenance priorities.

## The Problem

Grid maintenance can become reactive when equipment problems are addressed only after visible degradation, alarms, or outages occur.

Operators need a unified system that can identify vulnerable assets earlier, explain why an asset is considered risky, show its geographic and grid impact, and connect that information directly with maintenance and field-response workflows.

## Who Is Affected

GridGuard AI is designed for:

- Grid and control-room operators
- Maintenance engineers
- Field supervisors
- Utility administrators
- Reliability engineers

These users need different levels of operational access while working with the same grid-risk information.

## Why It Matters

A high-risk grid asset can affect more than the equipment itself. Failure may interrupt connected loads, affect customers, require emergency maintenance, and increase operational pressure on field teams.

Earlier identification and prioritization can help utilities move from reactive response toward preventive and risk-based maintenance.

## Current Challenge

Raw telemetry alone does not tell an operator what action should be taken first. Operators must consider multiple factors including equipment condition, sensor readings, historical incidents, weather exposure, asset criticality, and expected grid impact.

GridGuard AI addresses this by converting these signals into an explainable risk score and connecting the result to maintenance recommendations, geographic visualization, crew coordination, and incident management.

## Prototype Scope

This hackathon prototype uses simulated grid telemetry and operational records rather than a live utility SCADA or IoT feed.

Its risk assessment is a transparent multi-factor weighted scoring model. It is not presented as a production-trained machine-learning model or a utility-certified failure probability system.
