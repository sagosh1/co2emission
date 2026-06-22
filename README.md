# CO₂ Travel Emission Calculator

A comprehensive web and command-line application that helps international students calculate CO₂ emissions caused by their travel to university and back home during semester breaks. Built with modern JavaScript technologies.

**Author:** Sagosh Kumar  
**Course:** Architecture of Information Systems  
**Type:** Studienleistung (Course Assignment)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Available Commands](#available-commands)
- [Usage](#usage)
  - [Web Application](#web-application)
  - [CLI Application](#cli-application)
- [Testing & Quality Assurance](#testing--quality-assurance)
  - [Unit Tests](#unit-tests)
  - [Mutation Testing](#mutation-testing)
  - [Code Metrics](#code-metrics)
  - [Linting & Code Quality](#linting--code-quality)
- [Project Structure Details](#project-structure-details)
- [Reports](#reports)
- [CI/CD Pipeline](#cicd-pipeline)
- [Contributing](#contributing)

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

## 📁 Project Structure

```
co2-emission/
├── src/
│   ├── App.jsx                 # Main React component
│   ├── App.css                 # Application styles
│   ├── main.jsx                # React entry point
│   ├── index.css               # Global styles
│   ├── cli/
│   │   └── index.js            # Command-line interface
│   ├── data/
│   │   ├── data.js             # Transport modes & car models data
│   │   └── data.test.js        # Data tests
│   ├── hooks/
│   │   └── useEmissionResult.js # Custom React hook for calculations
│   └── lib/
│       ├── emissions.js        # Core calculation logic
│       └── emissions.test.js   # Calculation tests
├── scripts/
│   ├── metrics.js              # Code metrics calculation script
│   └── patch-mutation-report.js # Mutation report post-processor
├── public/                     # Static assets
├── coverage/                   # Test coverage reports
├── reports/
│   ├── metrics/                # Code metrics reports
│   └── mutation/               # Mutation testing reports
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI/CD pipeline
├── vite.config.js              # Vite configuration
├── eslint.config.js            # ESLint rules
├── stryker.config.json         # Mutation testing configuration
├── package.json                # Project dependencies & scripts
├── package-lock.json           # Dependency lock file
├── index.html                  # HTML entry point
└── README.md                   # This file
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 22.x LTS or higher
  - Download from: https://nodejs.org/
  - Verify: `node --version` and `npm --version`
- **Git**: For version control
  - Verify: `git --version`

---

## 🚀 Installation

### Step 1: Clone the Repository
```powershell
git clone <repository-url>
cd co2-emission
```

### Step 2: Install Dependencies
```powershell
npm install
```
This installs all project dependencies as specified in `package.json`

### Step 3: Verify Installation
```powershell
npm run lint
npm run test
```
Both commands should run without errors

---

## 📋 Available Commands

### Development Commands

#### Start Development Server
```powershell
npm run dev
```
- Starts Vite development server with Hot Module Replacement (HMR)
- Opens the application at `http://localhost:5173`
- Auto-reloads on file changes
- **Use for:** Active development and testing changes

#### Preview Production Build
```powershell
npm run preview
```
- Builds and serves the production version locally
- Useful for testing the optimized build before deployment
- **Use for:** Testing production-like environment locally

---

### Building Commands

#### Build for Production
```powershell
npm run build
```
- Creates optimized production bundle in `dist/` folder
- Minifies and tree-shakes unused code
- Generates source maps for debugging
- **Output:** `dist/` directory ready for deployment

---

### Application Execution

#### Run CLI Application
```powershell
npm run cli
```
- Launches the interactive command-line CO₂ calculator
- Presents menu-driven interface for input
- Calculates and displays emission results with ANSI colors
- **Use for:** Testing calculation logic and CLI interface

---

### Testing Commands

#### Run All Tests (Once)
```powershell
npm run test
```
- Executes all unit tests in the `src/**/*.test.js` files
- Uses Vitest as the test runner
- Outputs test results to console
- **Use for:** Quick test validation

#### Run Tests in Watch Mode
```powershell
npm run test:watch
```
- Runs tests and watches for file changes
- Automatically reruns affected tests
- Great for TDD (Test-Driven Development)
- **Use for:** Continuous development and testing

#### Run Tests with Coverage Report
```powershell
npm run test:coverage
```
- Executes all tests and generates coverage analysis
- Creates detailed coverage report in `coverage/` directory
- Shows code coverage percentages
- Generates HTML report: `coverage/index.html`
- **Use for:** Assessing test coverage before submission

---

### Code Quality Commands

#### Run ESLint
```powershell
npm run lint
```
- Analyzes code for quality issues and best practices
- Detects code smells (unused variables, high complexity, etc.)
- Checks for style violations
- Uses plugins: ESLint JS, React Hooks, React Refresh, SonarJS, Unicorn
- **Output:** List of issues (if any) with line numbers and suggestions
- **Use for:** Identifying code quality problems

---

### Mutation Testing Commands

#### Run Mutation Tests
```powershell
npm run mutate
```
- Executes Stryker mutation testing framework
- Tests the strength of your unit test suite
- Mutates code to verify tests catch the changes
- Generates mutation report: `reports/mutation/mutation.html`
- **Use for:** Ensuring test quality and identifying untested code paths

---

### Code Metrics Commands

#### Generate Code Metrics
```powershell
npm run metrics
```
- Analyzes source code and computes metrics
- Metrics calculated:
  - **LOC** (Lines of Code) - physical and logical
  - **Cyclomatic Complexity** - code path complexity
  - **Maintainability Index** - overall maintainability score
  - **Halstead Metrics** - program complexity measures
- Output files:
  - JSON report: `reports/metrics/metrics.json`
  - HTML report: `reports/metrics/metrics.html`
- **Use for:** Understanding code quality metrics and identifying complex functions

---

## 💻 Usage

### Web Application

1. **Start the development server:**
   ```powershell
   npm run dev
   ```

2. **Open in browser:**
   - Automatically opens at `http://localhost:5173`
   - Or manually navigate to the URL

3. **Use the calculator:**
   - Select a **Transport Mode** from the dropdown
   - If "Car" is selected, choose a **Car Model** with WLTP emissions data
   - Enter the **one-way distance** in kilometers
   - Set the **travel frequency** (number of round trips per semester)
   - View calculated CO₂ emissions in real-time

4. **Understanding Results:**
   - **Emissions per trip**: CO₂ in grams for one-way journey
   - **Total emissions**: Total CO₂ for all trips in kilograms
   - Results update automatically as you change inputs

### CLI Application

1. **Start the CLI:**
   ```powershell
   npm run cli
   ```

2. **Follow the interactive menu:**
   - Select transport mode (numbered menu)
   - If car selected, choose car model (WLTP values shown)
   - Enter distance in km
   - Enter frequency (number of trips)

3. **Example Interaction:**
   ```
   ╔══════════════════════════════════════╗
   ║   CO₂ Travel Calculator  (semester)  ║
   ╚══════════════════════════════════════╝

   Transport Options:
    1. Foot
    2. Bike
    3. Car
    [... more options ...]
   
   Enter your choice: 3
   [Car menu appears...]
   Enter distance (km): 500
   Enter frequency: 4
   
   Results displayed with formatted output
   ```

---

## 🧪 Testing & Quality Assurance

### Unit Tests

**Location:** `src/**/*.test.js`  
**Test Files:**
- `src/lib/emissions.test.js` - Core calculation function tests
- `src/data/data.test.js` - Data validation tests

**Run tests:**
```powershell
npm run test              # Run once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

**What's tested:**
- Emission factor calculations
- Invalid input handling
- Car model lookups
- Transport mode validation
- Edge cases and error conditions

---

### Mutation Testing

**Tool:** Stryker v9.6.1 with Vitest runner  
**Config:** `stryker.config.json`

**Run mutation tests:**
```powershell
npm run mutate
```

**Output:**
- HTML report: `reports/mutation/mutation.html`
- Clear text report in console
- Shows mutation scores for code quality assessment

**What it tests:**
- Identifies untested code paths
- Verifies test quality
- Measures effectiveness of test suite
- Reports killed vs. survived mutations

---

### Code Metrics

**Tool:** Custom metrics calculator  
**Script:** `scripts/metrics.js`

**Run metrics:**
```powershell
npm run metrics
```

**Reports Generated:**
- JSON format: `reports/metrics/metrics.json`
- HTML format: `reports/metrics/metrics.html`

**Metrics Included:**
- Physical LOC, Source LOC, Logical LOC
- Cyclomatic Complexity (per function & average)
- Maintainability Index
- Halstead Volume, Effort, and Bug Estimates
- Function-level analysis

---

### Linting & Code Quality

**Linters:**
- ESLint (base rules)
- React Hooks plugin
- React Refresh plugin
- SonarJS (bad smell detection)
- Unicorn (additional best practices)

**Run linting:**
```powershell
npm run lint
```

**Config:** `eslint.config.js`

**Rules Enforced:**
- No unused variables
- Complexity limits (max complexity: 10)
- Max depth: 4 levels
- Function length: max 60 lines per function
- React best practices
- Sonar rules for code smells

---

## 📊 Reports

All reports are generated in the `reports/` directory:

```
reports/
├── metrics/
│   ├── index.html          # HTML report (viewable in browser)
│   ├── metrics.html        # Detailed metrics
│   └── metrics.json        # Raw metrics data
└── mutation/
    └── mutation.html       # Mutation testing results
```

### Viewing Reports in Browser

```powershell
# Open metrics report
start reports/metrics/metrics.html

# Open mutation report
start reports/mutation/mutation.html

# Open coverage report
start coverage/index.html
```

---

## 🔄 CI/CD Pipeline

**File:** `.github/workflows/ci.yml`

The project includes a fully automated GitHub Actions pipeline that runs on every push and pull request:

### Pipeline Steps
1. **Checkout** - Retrieves code from repository
2. **Setup Node.js** - Configures Node.js 22.x environment
3. **Install Dependencies** - Runs `npm install`
4. **Build** - Executes `npm run build`
5. **Lint** - Runs `npm run lint` for code quality checks
6. **Unit Tests** - Runs `npm run test:coverage`
7. **Mutation Tests** - Runs `npm run mutate`
8. **Code Metrics** - Runs `npm run metrics`
9. **Upload Reports** - Archives reports as build artifacts

### Running Full Pipeline Locally

Execute all pipeline steps in order:
```powershell
npm install
npm run build
npm run lint
npm run test:coverage
npm run mutate
npm run metrics
```

Or as a single command:
```powershell
npm install && npm run build && npm run lint && npm run test:coverage && npm run mutate && npm run metrics
```

---

## 📝 Git & Version Control

### Viewing History
```powershell
git log --oneline -5
```

### Committing Changes
```powershell
git add .
git commit -m "Describe your changes"
git push
```
Pushing triggers the CI/CD pipeline automatically.

### Checking Status
```powershell
git status
```

---

## 🚢 Deployment

### Build for Production
```powershell
npm run build
```

### Deploy Steps
1. Build the project: `npm run build`
2. The `dist/` folder contains production-ready files
3. Deploy `dist/` contents to your hosting service
4. For GitHub Pages: Push to `gh-pages` branch

### Environment
- **Node Version:** 22.x LTS
- **Build Output:** `dist/` directory
- **Entry Point:** `dist/index.html`

---

## 🐛 Troubleshooting

### Port Already in Use
```powershell
# If port 5173 is busy, Vite will try the next port automatically
# Or specify a custom port:
npm run dev -- --port 3000
```

### Dependencies Issues
```powershell
# Clear node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Tests Failing
```powershell
# Run tests in watch mode to debug
npm run test:watch

# Check for linting errors first
npm run lint
```

### Build Errors
```powershell
# Clean and rebuild
npm run build -- --force
```

---

## 📚 Data Reference

### Supported Transport Modes
| Mode | Emissions | Notes |
|------|-----------|-------|
| Foot | 0 g CO₂/km | Zero emissions |
| Bike | 0 g CO₂/km | Zero emissions |
| Car | Varies | 12 models with WLTP values |
| Bus | 105 g CO₂/km | EU average diesel |
| Train | 60 g CO₂/km | EU average electric/diesel mix |
| Tram | 45 g CO₂/km | EU average electric |
| Metro | 50 g CO₂/km | EU average electric |
| Ferry | 120 g CO₂/km | EU average passenger ferry |

### Car Models (WLTP Certified)
- Volkswagen Golf - 180 g/km
- Ford Focus - 175 g/km
- Honda Civic - 170 g/km
- Hyundai i30 - 172 g/km
- Kia Ceed - 168 g/km
- Renault Megane - 160 g/km
- Peugeot 308 - 158 g/km
- Skoda Octavia - 182 g/km
- Opel Astra - 169 g/km
- BMW 320i - 210 g/km
- Mercedes C 220 - 205 g/km
- Tesla Model 3 - 0 g/km (Electric)

---

## 📄 License

This is a course assignment for "Architecture of Information Systems" at the university.

---

## 👤 Author

**Sagosh Kumar**

---

## 📞 Support

For issues or questions:
1. Check the project documentation
2. Review test files for usage examples
3. Check CI/CD pipeline logs for build errors
4. Review ESLint and Stryker reports for code quality insights

---

**Last Updated:** June 2026  
**Project Status:** Active Development
