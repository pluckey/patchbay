export const DEMO_WORKSPACE = {
  "version": 12,
  "id": "patchbay_demo_cockroach_rfc",
  "name": "Demo \u00b7 Should we migrate to CockroachDB?",
  "nodes": [],
  "connections": [
    {
      "id": "conn_src_to_ai1",
      "sourceId": "cell_src_rfc",
      "targetId": "cell_ai_1",
      "label": "source",
      "createdAt": 1778687228916,
      "gate": "open"
    },
    {
      "id": "conn_src_to_ai2",
      "sourceId": "cell_src_rfc",
      "targetId": "cell_ai_2",
      "label": "source",
      "createdAt": 1778687228916,
      "gate": "open"
    },
    {
      "id": "conn_src_to_ai3",
      "sourceId": "cell_src_rfc",
      "targetId": "cell_ai_3",
      "label": "source",
      "createdAt": 1778687228916,
      "gate": "open"
    },
    {
      "id": "conn_src_to_ai4",
      "sourceId": "cell_src_rfc",
      "targetId": "cell_ai_4",
      "label": "source",
      "createdAt": 1778687228916,
      "gate": "open"
    }
  ],
  "viewport": {
    "x": -20,
    "y": 0,
    "zoom": 0.62
  },
  "cells": [
    {
      "id": "cell_src_rfc",
      "type": "source",
      "title": "RFC: CockroachDB migration",
      "content": "## RFC: Migrate analytics workload from Postgres to CockroachDB\n\n**Author:** platform-eng@  \u00b7  **Status:** Draft  \u00b7  **Decide by:** Q3 planning\n\n### Current pain points\n\n- Vertical scaling ceiling hit at **32 vCPU** on the analytics replica\n- Replication lag spikes to **45 s+** during peak ingest (06:00 / 18:00 UTC)\n- Two emergency failovers in the last six months; ~$160K in incident cost\n- Maintenance windows require coordinated downtime across four product teams\n\n### Proposal\n\nMigrate the analytics workload to a 6-node CockroachDB cluster.\n\n- **Timeline:** 6 months, 3 engineers\n- **Capex:** ~$480K infra over 18 months (incl. egress, support)\n- **Risk:** serializable isolation will surface latent race conditions\n\n### Decision needed\n\nShip the migration, or invest the same six months hardening the existing Postgres path?\n",
      "position": {
        "x": 560,
        "y": 60
      },
      "createdAt": 1778687228916,
      "updatedAt": 1778687228916,
      "output": {
        "status": "success",
        "text": "## RFC: Migrate analytics workload from Postgres to CockroachDB\n\n**Author:** platform-eng@  \u00b7  **Status:** Draft  \u00b7  **Decide by:** Q3 planning\n\n### Current pain points\n\n- Vertical scaling ceiling hit at **32 vCPU** on the analytics replica\n- Replication lag spikes to **45 s+** during peak ingest (06:00 / 18:00 UTC)\n- Two emergency failovers in the last six months; ~$160K in incident cost\n- Maintenance windows require coordinated downtime across four product teams\n\n### Proposal\n\nMigrate the analytics workload to a 6-node CockroachDB cluster.\n\n- **Timeline:** 6 months, 3 engineers\n- **Capex:** ~$480K infra over 18 months (incl. egress, support)\n- **Risk:** serializable isolation will surface latent race conditions\n\n### Decision needed\n\nShip the migration, or invest the same six months hardening the existing Postgres path?\n",
        "durationMs": 0
      },
      "dimensions": {
        "width": 420,
        "height": 360
      }
    },
    {
      "id": "cell_ai_1",
      "type": "ai",
      "title": "Steelman: ship it",
      "instruction": "Steelman the migration. The strongest arguments FOR doing this.",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "outputMode": "text",
      "position": {
        "x": 100,
        "y": 520
      },
      "createdAt": 1778687228916,
      "updatedAt": 1778687228916,
      "output": {
        "status": "success",
        "text": "The cost argument is real but inverted. The $480K over 18 months is roughly what you spent on the last two emergency Postgres rescue ops combined. **You're already paying CockroachDB's price \u2014 you're just paying it as crisis cleanup instead of capital infrastructure.**\n\nThree load-bearing arguments:\n\n1. **Horizontal write scale is a one-time win.** Vertical scaling buys ~18 months, then you're back here with another migration window \u2014 except your engineers will have forgotten how Postgres internals work, because they spent those 18 months not learning them.\n\n2. **The 32 vCPU ceiling is a hidden recruiting tax.** Senior backend engineers know what it means when a 2026 analytics platform tops out at 32 vCPUs. CockroachDB opens doors; \"we run Postgres at the limit\" closes them.\n\n3. **Replication lag is a correctness bug, not a performance bug.** Every second of lag is a window where dashboards lie. You've accepted lying dashboards as table stakes \u2014 your customers haven't, they just don't know yet.",
        "durationMs": 4550
      },
      "lastInputHash": "[[\"RFC: CockroachDB migration\",\"## RFC: Migrate analytics workload from Postgres to CockroachDB\\n\\n**Author:** platform-eng@  \\u00b7  **Status:** Draft  \\u00b7  **Decide by:** Q3 planning\\n\\n### Current pain points\\n\\n- Vertical scaling ceiling hit at **32 vCPU** on the analytics replica\\n- Replication lag spikes to **45 s+** during peak ingest (06:00 / 18:00 UTC)\\n- Two emergency failovers in the last six months; ~$160K in incident cost\\n- Maintenance windows require coordinated downtime across four product teams\\n\\n### Proposal\\n\\nMigrate the analytics workload to a 6-node CockroachDB cluster.\\n\\n- **Timeline:** 6 months, 3 engineers\\n- **Capex:** ~$480K infra over 18 months (incl. egress, support)\\n- **Risk:** serializable isolation will surface latent race conditions\\n\\n### Decision needed\\n\\nShip the migration, or invest the same six months hardening the existing Postgres path?\\n\"]]",
      "dimensions": {
        "width": 360,
        "height": 480
      }
    },
    {
      "id": "cell_ai_2",
      "type": "ai",
      "title": "Steelman: don't",
      "instruction": "Steelman the status quo. The strongest arguments AGAINST doing this.",
      "provider": "openai",
      "model": "gpt-5",
      "outputMode": "text",
      "position": {
        "x": 500,
        "y": 520
      },
      "createdAt": 1778687228916,
      "updatedAt": 1778687228916,
      "output": {
        "status": "success",
        "text": "The strongest case against is that **you are solving the wrong problem**.\n\nYour write ceiling is not a database problem \u2014 it's an ingest pipeline problem. You're running OLTP-shaped writes against an OLAP-shaped workload, and no distributed database will fix that. It will only push the bottleneck downstream and add a Raft consensus tax to every operation.\n\nConcrete objections:\n\n1. **Serializable isolation will surface latent race conditions Postgres masks.** The migration will not be feature-equivalent. Six weeks of \"why did this query that always worked start hanging?\" sits between you and parity. The 6-month estimate misses this.\n\n2. **Three engineers for six months is your senior bench.** That runway is for fighting fires AND the migration AND the product roadmap. You will pick two. Probably fires and migration \u2014 and lose the product battle quietly.\n\n3. **The 18-month TCO ignores write amplification.** CockroachDB stores 3\u00d7 what Postgres stores. The $480K number assumes single-replica cost. Recalculate at 3\u00d7 and the math inverts.",
        "durationMs": 4900
      },
      "lastInputHash": "[[\"RFC: CockroachDB migration\",\"## RFC: Migrate analytics workload from Postgres to CockroachDB\\n\\n**Author:** platform-eng@  \\u00b7  **Status:** Draft  \\u00b7  **Decide by:** Q3 planning\\n\\n### Current pain points\\n\\n- Vertical scaling ceiling hit at **32 vCPU** on the analytics replica\\n- Replication lag spikes to **45 s+** during peak ingest (06:00 / 18:00 UTC)\\n- Two emergency failovers in the last six months; ~$160K in incident cost\\n- Maintenance windows require coordinated downtime across four product teams\\n\\n### Proposal\\n\\nMigrate the analytics workload to a 6-node CockroachDB cluster.\\n\\n- **Timeline:** 6 months, 3 engineers\\n- **Capex:** ~$480K infra over 18 months (incl. egress, support)\\n- **Risk:** serializable isolation will surface latent race conditions\\n\\n### Decision needed\\n\\nShip the migration, or invest the same six months hardening the existing Postgres path?\\n\"]]",
      "dimensions": {
        "width": 360,
        "height": 480
      }
    },
    {
      "id": "cell_ai_3",
      "type": "ai",
      "title": "Blindspot",
      "instruction": "What's the failure mode no one in the RFC is naming?",
      "provider": "xai",
      "model": "grok-4",
      "outputMode": "text",
      "position": {
        "x": 900,
        "y": 520
      },
      "createdAt": 1778687228916,
      "updatedAt": 1778687228916,
      "output": {
        "status": "success",
        "text": "The thing no one is naming: **this isn't really about the database.**\n\nThe proposal has the shape of a database migration. It's functionally a referendum on whether to admit that the analytics workload was never going to scale as a side effect of the transactional store. Either decision leaves that question unresolved.\n\nTwo failure modes the RFC doesn't mention:\n\n1. **The faction that wins the argument inherits the consequences.** Pro-migration wins \u2192 those same engineers are on-call when the first 3 AM Cockroach outage happens. Anti-migration wins \u2192 those same engineers own the next Postgres crisis. Neither side has discussed who's signing up to be wrong in 12 months.\n\n2. **You haven't asked what happens if you do nothing for 90 more days.** The RFC assumes binary now-or-later. Third option: ship a write-path circuit breaker for analytics ingest, buy a quarter, run the decision against actual production data instead of a whiteboard. Nobody benefits from that option \u2014 which is why nobody proposed it.",
        "durationMs": 5250
      },
      "lastInputHash": "[[\"RFC: CockroachDB migration\",\"## RFC: Migrate analytics workload from Postgres to CockroachDB\\n\\n**Author:** platform-eng@  \\u00b7  **Status:** Draft  \\u00b7  **Decide by:** Q3 planning\\n\\n### Current pain points\\n\\n- Vertical scaling ceiling hit at **32 vCPU** on the analytics replica\\n- Replication lag spikes to **45 s+** during peak ingest (06:00 / 18:00 UTC)\\n- Two emergency failovers in the last six months; ~$160K in incident cost\\n- Maintenance windows require coordinated downtime across four product teams\\n\\n### Proposal\\n\\nMigrate the analytics workload to a 6-node CockroachDB cluster.\\n\\n- **Timeline:** 6 months, 3 engineers\\n- **Capex:** ~$480K infra over 18 months (incl. egress, support)\\n- **Risk:** serializable isolation will surface latent race conditions\\n\\n### Decision needed\\n\\nShip the migration, or invest the same six months hardening the existing Postgres path?\\n\"]]",
      "dimensions": {
        "width": 360,
        "height": 480
      }
    },
    {
      "id": "cell_ai_4",
      "type": "ai",
      "title": "TL;DR for the steering committee",
      "instruction": "Three-bullet executive summary the steering committee would actually read.",
      "provider": "anthropic",
      "model": "claude-sonnet-4-20250514",
      "outputMode": "text",
      "position": {
        "x": 1300,
        "y": 520
      },
      "createdAt": 1778687228916,
      "updatedAt": 1778687228916,
      "output": {
        "status": "success",
        "text": "**1. The status quo is failing slowly.**\nPostgres replication lag is producing wrong analytics today, not as a future risk. This is a correctness issue, not a performance one.\n\n**2. The price tag is misleading in both directions.**\n$480K understates write amplification and re-test cost. It also understates the cost of *not* migrating \u2014 recurring crisis ops, recruiting drag, slow correctness rot.\n\n**3. The decision the RFC actually dodges:**\nWho owns the consequences in 18 months if you're wrong. Pick that person before picking the database.",
        "durationMs": 5600
      },
      "lastInputHash": "[[\"RFC: CockroachDB migration\",\"## RFC: Migrate analytics workload from Postgres to CockroachDB\\n\\n**Author:** platform-eng@  \\u00b7  **Status:** Draft  \\u00b7  **Decide by:** Q3 planning\\n\\n### Current pain points\\n\\n- Vertical scaling ceiling hit at **32 vCPU** on the analytics replica\\n- Replication lag spikes to **45 s+** during peak ingest (06:00 / 18:00 UTC)\\n- Two emergency failovers in the last six months; ~$160K in incident cost\\n- Maintenance windows require coordinated downtime across four product teams\\n\\n### Proposal\\n\\nMigrate the analytics workload to a 6-node CockroachDB cluster.\\n\\n- **Timeline:** 6 months, 3 engineers\\n- **Capex:** ~$480K infra over 18 months (incl. egress, support)\\n- **Risk:** serializable isolation will surface latent race conditions\\n\\n### Decision needed\\n\\nShip the migration, or invest the same six months hardening the existing Postgres path?\\n\"]]",
      "dimensions": {
        "width": 360,
        "height": 480
      }
    }
  ],
  "executionMode": "manual"
} as const
