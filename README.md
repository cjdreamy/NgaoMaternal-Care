# Welcome to Your NgaoMaternal_Care Project

name: NgaoMaternal Care


<h4>The Problem Statement</h4>
Despite medical advancements, many pregnant women in rural areas face a 'silent window' of risk between hospital visits. Maternal mortality remains high because complications—such as preeclampsia or fetal distress—are often detected too late. There is a critical lack of a Mobile Link to provide immediate education and support to these families. Currently, mothers, boys, and girls in remote households have no direct way to alert medical professionals during a home-based emergency, leading to preventable tragedies.
Once a patient leaves the clinic, there is no way to track their biological "warning signals."
The Vital Signs: For mothers, these include Blood Pressure (BP), Heart Rate, and Fetal Movement. For boys and girls, this includes Sleep Patterns and Heart Rate Variability (HRV).
The Risk: Without daily tracking, complications like pre-eclampsia or physical exhaustion are only caught when they become life-threatening emergencies.

<h4>The Concept</h4>
​(Monitoring): A USSD or SMS-based system that sends daily health "check-in" questions to the mother. If her answers indicate a risk, the system automatically flags her as a priority.
​The LifeLine (Emergency): A "Panic Button" feature. If a mother collapses or feels sudden pain, she—or the boys and girls in her home—can trigger a 1-step alert that sends her GPS location to the nearest clinic.
​The Link (Education): Weekly voice messages or texts in local languages that provide prenatal education, ensuring the entire family knows how to support a healthy pregnancy.

<h4>objectives</h4>

To bridge the communication gap between rural homes and healthcare facilities using a low-cost Mobile Link.
To provide a 24/7 Guardian system that identifies high-risk symptoms before they become fatal.
To empower families, including boys and girls, with the tools to act as first-responders during a maternal crisis.
To reduce the 'Three Delays' (delay in seeking care, delay in reaching care, and delay in receiving care).

Technology USSD, SMS, and AI-Voice (No internet required), webapp(urban areas internet is available).

Primary Goal Zero preventable maternal deaths in the target area.

Beneficiaries Expectant mothers and their boys and girls.

Innovation Real-time triage combined with GPS emergency tracking
include a User Onboarding, usually implemented as a Product/app Tour using Coach Marks.

 
      [ USER LAYER ]                [ PROCESSING LAYER ]             [ RESPONSE LAYER ]
   (Mother & Families)            (LifeLine Guardian AI)           (Doctors & Clinics)
   _______            _______            ________
  |                    |          |                    |          |                    |
  |  Standard Phone    |---SMS--->|   SMS/USSD Gateway |          |   Hospital Tablet/ |
  |  (USSD Interface)  |          |   (Ona/Frontline)  |          |   Web Dashboard    |
  |_______|          |______|          |_______|
            |                             |                             |
            |                             V                             |
    (Danger Signs Input)       ________           (Emergency Dispatch)
            |                 |                    |                    |
            |                 |   Cloud Database   |                    |
            |                 | (Patient Records)  |                    |
            |                 |________|                    |
            |                             |                             |
            |                             V                             |
    (Health Education)        ________           (Real-time Triage)
            |                 |                    |                    |
            |<----------------|  Logic Engine (AI) |------------------->|
   (Voice/Text Support)       | (Risk Assessment)  |           (Priority Alerts)
                              |________|


## Project Info

## Project Directory

```
├── README.md # Documentation
├── components.json # Component library configuration
├── index.html # Entry file
├── package.json # Package management
├── postcss.config.js # PostCSS configuration
├── public # Static resources directory
│   ├── favicon.png # Icon
│   └── images # Image resources
├── src # Source code directory
│   ├── App.tsx # Entry file
│   ├── components # Components directory
│   ├── context # Context directory
│   ├── db # Database configuration directory
│   ├── hooks # Common hooks directory
│   ├── index.css # Global styles
│   ├── layout # Layout directory
│   ├── lib # Utility library directory
│   ├── main.tsx # Entry file
│   ├── routes.tsx # Routing configuration
│   ├── pages # Pages directory
│   ├── services # Database interaction directory
│   ├── types # Type definitions directory
├── tsconfig.app.json # TypeScript frontend configuration file
├── tsconfig.json # TypeScript configuration file
├── tsconfig.node.json # TypeScript Node.js configuration file
└── vite.config.ts # Vite configuration file
```

## Tech Stack

Vite, TypeScript, React, Supabase, Nodejs

## Development Guidelines

### How to edit code locally?

You can choose [VSCode](https://code.visualstudio.com/Download) or any IDE you prefer. The only requirement is to have Node.js and npm installed.

### Environment Requirements

```
# Node.js ≥ 20
# npm ≥ 10
Example:
# node -v   # v20.18.3
# npm -v    # 10.8.2
```

### Installing Node.js on Windows

```
# Step 1: Visit the Node.js official website: https://nodejs.org/, click download. The website will automatically suggest a suitable version (32-bit or 64-bit) for your system.
# Step 2: Run the installer: Double-click the downloaded installer to run it.
# Step 3: Complete the installation: Follow the installation wizard to complete the process.
# Step 4: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.
```

### Installing Node.js on macOS

```
# Step 1: Using Homebrew (Recommended method): Open Terminal. Type the command `brew install node` and press Enter. If Homebrew is not installed, you need to install it first by running the following command in Terminal:
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
Alternatively, use the official installer: Visit the Node.js official website. Download the macOS .pkg installer. Open the downloaded .pkg file and follow the prompts to complete the installation.
# Step 2: Verify installation: Open Command Prompt (cmd) or your IDE terminal, and type `node -v` and `npm -v` to check if Node.js and npm are installed correctly.
```

### After installation, follow these steps:

```
# Step 1: Download the code package
# Step 2: Extract the code package
# Step 3: Open the code package with your IDE and navigate into the code directory
# Step 4: In the IDE terminal, run the command to install dependencies: npm i
# Step 5: In the IDE terminal, run the command to start the development server: npm run dev -- --host 127.0.0.1
# Step 6: if step 5 failed, try this command to start the development server: npx vite --host 127.0.0.1
```

### How to develop backend services?

Configure environment variables and install relevant dependencies.If you need to use a database, please use the official version of Supabase.

## Learn More

