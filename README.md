# CO₂ Travel Emission Calculator

A comprehensive web and command-line application that helps international students calculate CO₂ emissions caused by their travel to university and back home during semester breaks. Built with modern JavaScript technologies.

**Author:** Sagosh Kumar  
**Course:** Architecture of Information Systems  
**Type:** Studienleistung (Course Task)

---

## 🎯 Overview

The CO₂ Travel Emission Calculator is a full-stack application designed to compute CO₂ emissions for international students traveling between their home country and university. The application supports multiple transportation modes and includes detailed emission data based on real-world WLTP standards and EU averages.

### Key Highlights
- ✅ **8 Transportation Modes**: Foot, Bike, Car, Bus, Train, Tram, Metro, Ferry
- ✅ **12+ Car Models**: Includes electric (Tesla Model 3) and premium vehicles (BMW, Mercedes)
- ✅ **Dual Interface**: Modern React web UI + Interactive command-line interface
- ✅ **Comprehensive Testing**: Unit tests, mutation testing, and code coverage analysis
- ✅ **Automated Quality Assurance**: Linting, metrics, and bad smell detection
- ✅ **CI/CD Ready**: GitHub Actions pipeline for automated builds and testing

---


### Prerequisites
- Node.js 22.x LTS or later (recommended). Install from https://nodejs.org 

Verify installation:
```powershell
node --version
npm --version
```
---

## Commands
- Start dev server: `npm run dev`
- Build production: `npm run build`
- Run CLI: `npm run cli`
- Run tests: `npm run test`
- Run tests with coverage: `npm run test:coverage`
- Lint code: `npm run lint`
- Mutation testing: `npm run mutate`
- Generate metrics: `npm run metrics`

---

## ✨ Features

### Calculation Engine
- Calculates total CO₂ emissions in grams and kilograms
- Supports one-way distance with configurable frequency (number of trips)
- WLTP-certified car emission data
- EU average emission values for public transport
- Zero-emission modes (walking, cycling, electric vehicles)

### User Interfaces
1. **Web Application (React)**
   - Responsive, modern UI built with React 19
   - Real-time calculation updates
   - Dropdown selectors for transport mode and car models
   - Distance and frequency inputs
   - Result display with detailed breakdown

2. **Command-Line Interface (CLI)**
   - Interactive menu-driven interface
   - ANSI color-coded output
   - STDIN/STDOUT based input handling
   - Formatted results with emission breakdowns

### Quality Assurance
- **Unit Testing**: Comprehensive vitest suite
- **Mutation Testing**: Stryker integration for mutation analysis
- **Code Coverage**: Detailed coverage reports
- **Static Analysis**: ESLint with SonarJS and Unicorn plugins
- **Code Metrics**: LOC, cyclomatic complexity, maintainability index, Halstead metrics

---

## 🛠 Technology Stack

### Core Technologies
| Category | Technology | Version |
|----------|-----------|---------|
| **Frontend Framework** | React | 19.2.6 |
| **Build Tool** | Vite | 8.0.12 |
| **Language** | JavaScript (ES Modules) | - |
| **Styling** | CSS 3 | - |

### Development & Testing
| Tool | Purpose | Version |
|------|---------|---------|
| **Unit Testing** | Vitest | 4.1.9 |
| **Mutation Testing** | Stryker | 9.6.1 |
| **Code Coverage** | @vitest/coverage-v8 | 4.1.9 |
| **Linting** | ESLint | 10.3.0 |
| **Code Analysis** | SonarJS, Unicorn | Latest |

### Build & Deployment
| Tool | Purpose |
|------|---------|
| **Version Control** | Git |
| **CI/CD** | GitHub Actions |
| **Node.js** | 22.x LTS |
| **Package Manager** | npm |

---



