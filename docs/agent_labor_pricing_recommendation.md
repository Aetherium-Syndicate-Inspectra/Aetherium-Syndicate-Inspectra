# Agent Labor Pricing Recommendation for On-Demand Serverless Agents

## Executive Recommendation

Use a **hybrid model**:

1. **Primary billing:** time-based labor (active execution seconds + token/I/O usage)
2. **Optional commercial wrapper:** fixed-price per task via quote or SLA tiers

This preserves cost fairness at infrastructure level while giving buyers a predictable price option.

## Why not fixed-price only

A fixed-only model is easy to understand, but it weakens the incentive alignment in a highly variable system:

- Task complexity can vary significantly even within one task type.
- With 30,000 agents, wake-up latency, retries, and context-hydration paths are not constant.
- Providers may overprice to hedge risk, reducing adoption.

Result: users get predictable invoices, but total platform efficiency can drop.

## Why time-based should be the core

Time-based labor closely matches your architecture principles:

- **On-demand serverless activation** means costs occur only during active work.
- **Granular metering** (CPU-seconds, model tokens, I/O) maps directly to real resource usage.
- **Role-based labor rates** (Planner > Executor) are naturally expressible in per-second pricing.
- **Infrastructure tax/service fee** can be transparently added as a percentage or fixed surcharge.

Result: strong incentive for fast, accurate agents and better ecosystem-level efficiency.

## Best incentive design for adoption

To maximize user trust and usage, expose both views of pricing:

- **Runtime Meter (actual):**
  - Active execution seconds
  - Input/output token count
  - I/O or external tool calls
  - Service fee
- **Task Cap (optional):**
  - User can set a max budget per task
  - System auto-stops or downgrades model tier at cap threshold
- **Quoted Fixed Price (optional):**
  - For repetitive workflows, offer fixed bundles generated from historical P50/P95 runtime

This combines predictability for buyers with efficiency pressure for builders.

## Suggested formula (simple and explainable)

`Total Cost = Σ(ActiveSeconds_by_AgentClass × Rate_per_Second) + TokenCost + IOCost + ServiceFee`

Where:

- `Rate_per_Second` differs by class (Planner, Specialist, Executor)
- `ServiceFee` can be: `max(BaseFee, VariableFee%)`

## Direct answer to your question

If you must choose one model to drive behavior in your proposed architecture, choose **time-based labor** as the default.

If your goal is user acquisition and enterprise procurement comfort, offer **fixed-price per task as a packaging layer** on top of the same time-based metering engine.
