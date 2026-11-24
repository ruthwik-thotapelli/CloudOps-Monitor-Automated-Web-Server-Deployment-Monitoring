<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:38bdf8,50:818cf8,100:a78bfa&height=210&section=header&text=CloudOps%20Monitor&fontSize=60&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Automate.%20Monitor.%20Self-Heal.&descSize=20&descAlignY=60" alt="CloudOps Monitor banner" width="100%"/>

### Automated Web Server Deployment &amp; Continuous Monitoring
**AWS EC2 · Puppet · Nginx · Nagios Core**

*A dark-glass, zero-dependency interactive showcase of a declarative deploy, detect, and self-heal DevOps loop.*

<br/>

[![Static site](https://img.shields.io/badge/site-static-38bdf8?style=for-the-badge)](#-run-it-in-10-seconds)
[![Zero build](https://img.shields.io/badge/build-none-818cf8?style=for-the-badge)](#-tech-stack)
[![Nginx ready](https://img.shields.io/badge/deploy-Nginx-34d399?style=for-the-badge)](#-deploy-on-nginx)
[![Vanilla JS](https://img.shields.io/badge/JS-vanilla-eab308?style=for-the-badge)](#-tech-stack)
[![A11y](https://img.shields.io/badge/a11y-keyboard%20%2B%20reduced%20motion-f472b6?style=for-the-badge)](#-ui-interaction-flow)

[**Architecture**](#-architecture) · [**Flows**](#-flow-gallery) · [**Self-heal**](#-the-self-healing-loop) · [**Run**](#-run-it-in-10-seconds) · [**Deploy**](#-deploy-on-nginx) · [**Viva runbook**](#-live-demo-runbook)

</div>

---

> [!IMPORTANT]
> **Honest scope.** This repository is a **static front-end showcase** of the CloudOps Monitor design. Every host state, metric, timestamp and check output on the dashboard is **illustrative sample data**. *Simulate Drift & Heal* only animates states in your browser. The repo contains **no** Puppet manifests, Nagios config, provisioning code, credentials, or running server, and the diagrams describe the **target design**, not proof of a live deployment.

---

## ⚡ At a glance

| | |
|---|---|
| 🎯 **Goal** | Replace manual server administration with declared state and independent health verification |
| 🧱 **Stack** | AWS EC2 · Ubuntu 22.04 LTS · Puppet · Nginx · Nagios Core |
| 🔁 **Core idea** | *Puppet declares → Nginx serves → Nagios watches → Puppet heals → Nagios confirms* |
| 🖥️ **Showcase** | 7 sections · animated topology · tabbed workflow · mock Nagios console |
| 📦 **Footprint** | 3 files (`index.html`, `style.css`, `script.js`), no framework, no npm, no build |

---

## 🧭 Flow gallery

Every diagram below renders natively on GitHub (Mermaid). Jump to the one you need:

| # | Diagram | What it answers |
|---|---|---|
| 1 | [System architecture](#-architecture) | What are the components and who talks to whom? |
| 2 | [Delivery pipeline](#-end-to-end-delivery-pipeline) | How does a change reach a visitor? |
| 3 | [Self-healing loop](#-the-self-healing-loop) | What happens when Nginx dies? |
| 4 | [Nagios state machine](#-nagios-alert-state-machine) | How does a check go OK → CRITICAL HARD → OK? |
| 5 | [Puppet run lifecycle](#-puppet-agent-run-lifecycle) | What does one convergence run do? |
| 6 | [Network &amp; security](#-network--security-boundaries) | Which ports and trust boundaries exist? |
| 7 | [UI interaction flow](#-ui-interaction-flow) | How does the showcase page behave? |
| 8 | [Demo timeline](#-demo-simulation-timeline) | What does the browser simulation animate, and when? |

---

## 🏗 Architecture

> Logical **target design**. Exact EC2 layout depends on how the infrastructure is deployed.

```mermaid
flowchart LR
    User(["🌐 User's browser"])

    subgraph AWS["☁️ AWS EC2 environment · target design"]
        direction LR
        Master["🧠 Puppet Master<br/>site.pp · catalog compiler"]

        subgraph Web["🖥 Ubuntu 22.04 web node"]
            direction TB
            Agent["🛡 Puppet Agent<br/>enforces desired state"]
            Nginx["⚡ Nginx<br/>static site · :80"]
            Agent -->|"package · file · service"| Nginx
        end

        Nagios["👁 Nagios Core<br/>check_ping · check_http<br/>check_disk · check_procs"]

        Master ==>|"desired-state catalog"| Agent
        Nagios -.->|"independent health probes"| Web
    end

    User ==>|"HTTP / HTTPS"| Nginx

    classDef brain fill:#312e81,stroke:#818cf8,color:#e0e7ff
    classDef web fill:#064e3b,stroke:#34d399,color:#d1fae5
    classDef watch fill:#4c0519,stroke:#fb7185,color:#ffe4e6
    classDef user fill:#0c4a6e,stroke:#38bdf8,color:#e0f2fe
    class Master,Agent brain
    class Nginx web
    class Nagios watch
    class User user
```

**Design principle:** the *thing that fixes* (Puppet) and the *thing that watches* (Nagios) are deliberately **independent**. A watchdog that shares fate with the service it watches is not a watchdog.

---

## 🚚 End-to-end delivery pipeline

```mermaid
flowchart TD
    A([Start]) --> B["1 · Launch EC2<br/>Ubuntu 22.04 LTS"]
    B --> C["2 · Security group<br/>80 open · 22 restricted"]
    C --> D["3 · Install puppet-agent<br/>sign certificate"]
    D --> E["4 · Declare state in site.pp<br/>package · service · file"]
    E --> F{"Catalog<br/>compiles?"}
    F -- "no" --> E
    F -- "yes" --> G["5 · Agent applies catalog<br/>Nginx installed, enabled, running"]
    G --> H["6 · Site served on :80"]
    H --> I["7 · Nagios probes<br/>ping · HTTP · disk · process"]
    I --> J{"All checks OK?"}
    J -- "yes" --> K(["✅ Healthy · keep watching"])
    J -- "no" --> L["Alert raised<br/>CRITICAL / WARNING"]
    L --> M["Puppet reconciles drift"]
    M --> I
    K --> I

    classDef ok fill:#064e3b,stroke:#34d399,color:#d1fae5
    classDef bad fill:#4c0519,stroke:#fb7185,color:#ffe4e6
    classDef step fill:#1e1b4b,stroke:#818cf8,color:#e0e7ff
    class K,H ok
    class L bad
    class B,C,D,E,G,I,M step
```

---

## 🩹 The self-healing loop

The signature scenario of the project: **break Nginx on purpose, watch the system recover.**

```mermaid
sequenceDiagram
    autonumber
    actor Admin as 👤 Admin
    participant N as ⚡ Nginx (:80)
    participant G as 👁 Nagios Core
    participant A as 🛡 Puppet Agent
    participant M as 🧠 Puppet Master

    Admin->>N: sudo systemctl stop nginx
    Note over N: Service is down (drift from desired state)

    loop every check interval
        G->>N: check_http (port 80)
        N--xG: Connection refused
    end
    G->>G: SOFT → HARD after max_check_attempts
    G-->>Admin: 🔴 CRITICAL · HTTP Web Availability

    A->>M: Request catalog (scheduled run or manual)
    M-->>A: Catalog: Service[nginx] ensure => running
    A->>N: Start service
    N-->>A: active (running)
    A-->>Admin: Notice: ensure changed 'stopped' to 'running'

    G->>N: check_http
    N-->>G: HTTP/1.1 200 OK
    G-->>Admin: 🟢 RECOVERY · HTTP Web Availability OK
```

> Recovery time depends on the agent's run interval (Puppet's default is 30 minutes) unless you trigger a run manually with `puppet agent -t`, as the runbook below does.

---

## 🚦 Nagios alert state machine

```mermaid
stateDiagram-v2
    direction LR
    [*] --> OK_HARD

    OK_HARD: OK (HARD)
    CRIT_SOFT: CRITICAL (SOFT)<br/>attempt 1..2 of 3
    CRIT_HARD: CRITICAL (HARD)<br/>notify contacts

    OK_HARD --> CRIT_SOFT: check fails
    CRIT_SOFT --> CRIT_SOFT: retry fails (attempt < 3)
    CRIT_SOFT --> OK_HARD: retry succeeds
    CRIT_SOFT --> CRIT_HARD: attempt 3 fails
    CRIT_HARD --> CRIT_HARD: still failing · renotify per interval
    CRIT_HARD --> OK_HARD: check succeeds · RECOVERY notice
```

Parameters used in the showcase config snippet: `check_interval 1` · `retry_interval 1` · `max_check_attempts 3` · `notification_interval 30`.

---

## 🔄 Puppet agent run lifecycle

```mermaid
flowchart LR
    S(["⏱ Run starts<br/>timer or puppet agent -t"]) --> F["Collect facts<br/>OS · IP · hostname"]
    F --> R["Request catalog<br/>from Puppet Master"]
    R --> C["Master compiles<br/>site.pp for this node"]
    C --> P["Agent receives catalog"]
    P --> Q{"For each resource:<br/>actual = desired?"}
    Q -- "yes" --> I["No change<br/>idempotent"]
    Q -- "no" --> X["Apply change<br/>install · write · start"]
    X --> N["Notify dependents<br/>e.g. restart Nginx"]
    I --> RP["Send report"]
    N --> RP
    RP --> E(["Run complete"])

    classDef hot fill:#4a1d96,stroke:#a78bfa,color:#ede9fe
    class X,N hot
```

Resources shown in the demo manifest: `Package['nginx']` → `Service['nginx']` (running, enabled) → `File['/var/www/html/index.html']` (mode `0644`, notifies the service).

---

## 🛡 Network &amp; security boundaries

```mermaid
flowchart TB
    Internet(["🌍 Internet"])
    Trusted(["🔑 Trusted admin IP"])

    subgraph VPC["Amazon VPC"]
        subgraph SG["Security group"]
            direction TB
            P80["TCP 80 · HTTP<br/>open to visitors"]
            P22["TCP 22 · SSH<br/>trusted source only"]
        end
        Host["Ubuntu 22.04 · Nginx"]
    end

    Internet ==>|"allowed"| P80 --> Host
    Trusted ==>|"allowed"| P22 --> Host
    Internet -. "blocked" .-x P22

    classDef open fill:#064e3b,stroke:#34d399,color:#d1fae5
    classDef lock fill:#78350f,stroke:#fbbf24,color:#fef3c7
    class P80 open
    class P22 lock
```

- Never expose SSH broadly, and never commit AWS keys, SSH keys or passwords.
- The default commands in this README do **not** configure HTTPS. Add a domain and TLS before any internet-facing use.

---

## 🖱 UI interaction flow

How the showcase page itself behaves (`script.js`):

```mermaid
flowchart TD
    L(["Page load"]) --> J["Add .js class to html"]
    J --> M["Mobile menu<br/>click · Esc · outside click"]
    J --> T["Workflow tabs<br/>click · ← → · Home · End"]
    J --> O["IntersectionObserver<br/>reveal-on-scroll"]
    J --> S["Simulate Drift & Heal button"]

    O --> O2{"Observer<br/>supported?"}
    O2 -- "yes" --> O3["Fade in when visible"]
    O2 -- "no" --> O4["Show everything immediately"]

    T --> T2["Update aria-selected,<br/>tabindex, active panel"]
    S --> S2["Disable button · run timed demo"]
    S2 --> S3(["Re-enable when finished"])
```

Accessibility: ARIA tab semantics, roving `tabindex`, `aria-live` on the simulation message, visible focus rings, and a `prefers-reduced-motion` fallback.

---

## ⏱ Demo simulation timeline

What **Simulate Drift &amp; Heal** animates in the browser (no network calls):

```mermaid
gantt
    title Browser-only simulation (approx. 2.9 s)
    dateFormat  X
    axisFormat  %L ms

    section Dashboard state
    Idle · all sample checks OK                :done, 0, 0
    Wait before outage                          :a1, 0, 750
    Outage shown · Host DOWN, HTTP CRITICAL     :crit, a2, 750, 1800
    Puppet restore shown · catalog applied      :active, a3, 1800, 2900
    Back to OK · button re-enabled              :done, a4, 2900, 3000
```

| Phase | Offset | What changes on screen |
|---|---|---|
| Start | 0 ms | Button disabled, "DEMO SIMULATION" notice appears |
| Outage | 750 ms | Host `DOWN · DEMO`, HTTP `CRITICAL · DEMO`, cards and rows turn red |
| Heal | ≈1800 ms | Puppet card shows `RESTORED · DEMO` |
| Recovered | ≈2900 ms | All sample checks return to `OK · DEMO`, button re-enabled |

---

## 🧰 Tech stack

| Layer | Technology | Role |
|---|---|---|
| ☁️ Cloud | **AWS EC2** | Target compute environment |
| 🐧 OS | **Ubuntu Server 22.04 LTS** | Example Linux host (systemd) |
| 🧠 Config mgmt | **Puppet** | Declares and enforces server state |
| ⚡ Web | **Nginx** | Serves the static site |
| 👁 Monitoring | **Nagios Core** | Host and service health checks |
| 🎨 Showcase | **HTML5 · CSS3 · vanilla JS** | Responsive glassmorphic UI, no dependencies |

---

## 🚀 Run it in 10 seconds

```bash
git clone https://github.com/ruthwik-thotapelli/CloudOps-Monitor-Automated-Web-Server-Deployment-Monitoring.git
cd CloudOps-Monitor-Automated-Web-Server-Deployment-Monitoring
```

Then open `index.html`:

```powershell
# Windows PowerShell
Start-Process .\index.html
```

```bash
# macOS
open index.html

# Linux
xdg-open index.html
```

No install, no internet needed: system fonts, inline SVG, local CSS.

---

## 🌍 Deploy on Nginx

```bash
sudo apt update
sudo apt install -y nginx
sudo install -d -m 0755 /var/www/html
sudo install -m 0644 index.html style.css script.js /var/www/html/
sudo nginx -t
sudo systemctl enable --now nginx
```

Allow inbound **TCP 80** in the host firewall and EC2 security group, and restrict **TCP 22** to trusted addresses.

**Update an existing deployment:**

```bash
sudo install -m 0644 index.html style.css script.js /var/www/html/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 🎬 Live demo runbook

Use this when presenting the *real* loop on infrastructure you have built (the repo itself does not provide it).

<details>
<summary><b>Step-by-step presentation script (click to expand)</b></summary>

1. **Show healthy state:** Nagios console shows `HTTP Web Availability` = OK.
2. **Break it on purpose:**
   ```bash
   sudo systemctl stop nginx
   ```
3. **Show detection:** after the retry attempts, Nagios flips to CRITICAL (`Connection refused`, port 80).
4. **Trigger reconciliation** (or wait for the scheduled run):
   ```bash
   sudo /opt/puppetlabs/bin/puppet agent -t
   ```
5. **Show the Puppet notice:** `Service[nginx]/ensure: ensure changed 'stopped' to 'running'`.
6. **Show recovery:** Nagios returns to OK on the next check.
7. **Close with the point:** *declared state fixes, independent monitoring verifies.*

</details>

<details>
<summary><b>Why Puppet + Nagios instead of shell scripts?</b></summary>

| Concern | Ad-hoc bash | Puppet + Nagios |
|---|---|---|
| Idempotency | You must hand-code guards | Built into resources |
| Drift | Invisible until something breaks | Reconciled every run |
| Auditability | Whatever was logged | Versioned manifests + run reports |
| Failure detection | Often none | Independent, continuous checks |
| Scale | One server at a time | Same manifest across a fleet |

</details>

---

## 🗂 Project files

```text
.
├── index.html   # Semantic page, inline SVG illustrations, all 7 sections
├── style.css    # Responsive dark-glass layout, animations, reduced-motion support
├── script.js    # Mobile menu, ARIA tabs, scroll reveals, demo simulation
└── README.md    # You are here
```

**Verify JavaScript syntax** (if Node.js is installed):

```bash
node --check script.js
```

---

## 🔐 Security notes

- Never put AWS keys, SSH private keys, passwords or other secrets in this site or its Git history.
- The dashboard is public presentation content, **not** an authenticated monitoring console.
- Apply least-privilege network rules and configure HTTPS before any public deployment beyond a demo.

---

## 🗺 Roadmap: from showcase to real stack

- [x] Responsive, accessible showcase site
- [x] Documented architecture and failure/recovery flows
- [ ] Add real Puppet module (`nginx`, `web` content) to the repo
- [ ] Add Nagios object definitions (host, services, contacts)
- [ ] Provisioning code (Terraform or CloudFormation) for EC2 + security group
- [ ] HTTPS with a real domain (Let's Encrypt)
- [ ] CI: `node --check`, HTML validation, link check
- [ ] Add an explicit LICENSE

---

## ❓ FAQ

<details>
<summary><b>Is the dashboard live?</b></summary>
No. All values are sample data rendered in the browser; nothing contacts AWS, Puppet or Nagios.
</details>

<details>
<summary><b>Can I reuse this code?</b></summary>
No license file is included yet, so reuse rights are not granted. Add a license first.
</details>

<details>
<summary><b>Do I need to build anything?</b></summary>
No. Open <code>index.html</code>, or copy the three files into an Nginx web root.
</details>

---

<div align="center">

**Declare it. Serve it. Watch it. Heal it.**

<img src="https://capsule-render.vercel.app/api?type=waving&color=0:a78bfa,50:818cf8,100:38bdf8&height=110&section=footer" alt="footer wave" width="100%"/>

</div>
