use std::sync::atomic::{AtomicU64, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

pub const INTENT_DIMENSIONS: usize = 1024;
pub const ENTROPY_SEED_BYTES: usize = 32;

static LAMPORT_CLOCK: AtomicU64 = AtomicU64::new(0);

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CognitiveState {
    pub explore_resolve: f32,
    pub abstract_concrete: f32,
    pub subjective_objective: f32,
    pub divergent_convergent: f32,
    pub passive_active: f32,
    pub emotional_valence: f32,
    pub energy_level: f32,
    pub turbulence: f32,
}

impl CognitiveState {
    pub fn is_normalized(&self) -> bool {
        let values = [
            self.explore_resolve,
            self.abstract_concrete,
            self.subjective_objective,
            self.divergent_convergent,
            self.passive_active,
            self.emotional_valence,
            self.energy_level,
            self.turbulence,
        ];

        values.into_iter().all(|value| (-1.0..=1.0).contains(&value))
    }
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct TachyonMetadata {
    pub entropy_seed: [u8; ENTROPY_SEED_BYTES],
    pub payload_ptr: u64,
    pub rkey: u32,
    pub ghost_flag: bool,
    pub _padding: [u8; 3],
}

#[repr(C)]
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct Provenance {
    pub sender_hash: u64,
    pub integrity_hash: u64,
    pub audit_clearance: bool,
    pub _padding: [u8; 7],
}

#[repr(C)]
#[derive(Debug, Clone, PartialEq)]
pub struct IntentVectorV2 {
    sync_id: u64,
    version: u32,
    frozen: bool,
    _header_padding: [u8; 3],
    intent_vector: [f32; INTENT_DIMENSIONS],
    cognitive_state: CognitiveState,
    tachyon_metadata: TachyonMetadata,
    provenance: Provenance,
}

impl IntentVectorV2 {
    pub const fn size_in_bytes() -> usize {
        std::mem::size_of::<Self>()
    }

    pub fn sync_id(&self) -> u64 {
        self.sync_id
    }

    pub fn version(&self) -> u32 {
        self.version
    }

    pub fn frozen(&self) -> bool {
        self.frozen
    }

    pub fn intent_vector(&self) -> &[f32; INTENT_DIMENSIONS] {
        &self.intent_vector
    }

    pub fn cognitive_state(&self) -> &CognitiveState {
        &self.cognitive_state
    }

    pub fn metadata(&self) -> &TachyonMetadata {
        &self.tachyon_metadata
    }

    pub fn provenance(&self) -> &Provenance {
        &self.provenance
    }

    pub fn create_new_version(
        &self,
        next_vector: [f32; INTENT_DIMENSIONS],
        next_state: CognitiveState,
        next_metadata: TachyonMetadata,
        next_provenance: Provenance,
    ) -> Result<Self, GovernanceRejection> {
        IntentVectorBuilder::new(next_vector)
            .with_cognitive_state(next_state)
            .with_metadata(next_metadata)
            .with_provenance(next_provenance)
            .build_with_version(self.version + 1)
    }
}

#[derive(Debug, Clone)]
pub struct IntentVectorBuilder {
    intent_vector: [f32; INTENT_DIMENSIONS],
    cognitive_state: Option<CognitiveState>,
    metadata: Option<TachyonMetadata>,
    provenance: Option<Provenance>,
}

impl IntentVectorBuilder {
    pub fn new(intent_vector: [f32; INTENT_DIMENSIONS]) -> Self {
        Self {
            intent_vector,
            cognitive_state: None,
            metadata: None,
            provenance: None,
        }
    }

    pub fn with_cognitive_state(mut self, cognitive_state: CognitiveState) -> Self {
        self.cognitive_state = Some(cognitive_state);
        self
    }

    pub fn with_metadata(mut self, metadata: TachyonMetadata) -> Self {
        self.metadata = Some(metadata);
        self
    }

    pub fn with_provenance(mut self, provenance: Provenance) -> Self {
        self.provenance = Some(provenance);
        self
    }

    pub fn build(self) -> Result<IntentVectorV2, GovernanceRejection> {
        self.build_with_version(1)
    }

    fn build_with_version(self, version: u32) -> Result<IntentVectorV2, GovernanceRejection> {
        let cognitive_state = self
            .cognitive_state
            .ok_or(GovernanceRejection::MissingCognitiveState)?;
        let tachyon_metadata = self.metadata.ok_or(GovernanceRejection::MissingMetadata)?;
        let provenance = self
            .provenance
            .ok_or(GovernanceRejection::MissingProvenance)?;

        let envelope = IntentVectorV2 {
            sync_id: next_lamport_timestamp(),
            version,
            frozen: true,
            _header_padding: [0; 3],
            intent_vector: self.intent_vector,
            cognitive_state,
            tachyon_metadata,
            provenance,
        };

        run_governance_veto(&envelope)?;
        Ok(envelope)
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GovernanceRejection {
    MissingCognitiveState,
    MissingMetadata,
    MissingProvenance,
    InspiraRejected,
    FirmaRejected,
    AuditRejected,
}

pub fn next_lamport_timestamp() -> u64 {
    let wall_clock_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .expect("clock drift before UNIX_EPOCH")
        .as_millis() as u64;

    loop {
        let observed = LAMPORT_CLOCK.load(Ordering::Relaxed);
        let candidate = (observed.max(wall_clock_ms)).saturating_add(1);
        if LAMPORT_CLOCK
            .compare_exchange(observed, candidate, Ordering::SeqCst, Ordering::SeqCst)
            .is_ok()
        {
            return candidate;
        }
    }
}

pub fn run_governance_veto(vector: &IntentVectorV2) -> Result<(), GovernanceRejection> {
    inspira_check(vector)?;
    firma_check(vector)?;
    audit_gate(vector)?;
    Ok(())
}

fn inspira_check(vector: &IntentVectorV2) -> Result<(), GovernanceRejection> {
    let state = vector.cognitive_state();
    if !state.is_normalized() {
        return Err(GovernanceRejection::InspiraRejected);
    }

    if state.turbulence > 0.9 {
        return Err(GovernanceRejection::InspiraRejected);
    }

    Ok(())
}

fn firma_check(vector: &IntentVectorV2) -> Result<(), GovernanceRejection> {
    let has_invalid_vector_entry = vector
        .intent_vector()
        .iter()
        .any(|value| !value.is_finite() || value.abs() > 1.0);

    if has_invalid_vector_entry {
        return Err(GovernanceRejection::FirmaRejected);
    }

    Ok(())
}

fn audit_gate(vector: &IntentVectorV2) -> Result<(), GovernanceRejection> {
    if !vector.provenance().audit_clearance {
        return Err(GovernanceRejection::AuditRejected);
    }

    Ok(())
}

pub fn identity_annihilation(sender_id: &str) -> u64 {
    const FNV_OFFSET_BASIS: u64 = 0xcbf29ce484222325;
    const FNV_PRIME: u64 = 0x00000100000001B3;

    sender_id
        .as_bytes()
        .iter()
        .fold(FNV_OFFSET_BASIS, |hash, byte| {
            (hash ^ (*byte as u64)).wrapping_mul(FNV_PRIME)
        })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_vector() -> [f32; INTENT_DIMENSIONS] {
        let mut vector = [0.0; INTENT_DIMENSIONS];
        vector[0] = 0.12;
        vector[1] = -0.45;
        vector
    }

    fn sample_state() -> CognitiveState {
        CognitiveState {
            explore_resolve: 0.7,
            abstract_concrete: -0.3,
            subjective_objective: 0.2,
            divergent_convergent: 0.8,
            passive_active: 0.9,
            emotional_valence: 0.85,
            energy_level: 0.92,
            turbulence: 0.15,
        }
    }

    fn sample_metadata() -> TachyonMetadata {
        TachyonMetadata {
            entropy_seed: [7u8; ENTROPY_SEED_BYTES],
            payload_ptr: 0x7ffd1234,
            rkey: 0xabcd,
            ghost_flag: false,
            _padding: [0; 3],
        }
    }

    fn sample_provenance() -> Provenance {
        Provenance {
            sender_hash: identity_annihilation("agent_alpha_v3"),
            integrity_hash: 0xDEADBEEF,
            audit_clearance: true,
            _padding: [0; 7],
        }
    }

    #[test]
    fn schema_size_is_close_to_tachyon_target() {
        assert!(IntentVectorV2::size_in_bytes() >= 4_192);
        assert!(IntentVectorV2::size_in_bytes() <= 4_256);
    }

    #[test]
    fn lamport_timestamp_monotonicity() {
        let a = next_lamport_timestamp();
        let b = next_lamport_timestamp();
        assert!(b > a);
    }

    #[test]
    fn envelope_freezes_after_build() {
        let envelope = IntentVectorBuilder::new(sample_vector())
            .with_cognitive_state(sample_state())
            .with_metadata(sample_metadata())
            .with_provenance(sample_provenance())
            .build()
            .expect("should pass governance");

        assert!(envelope.frozen());
        assert_eq!(envelope.version(), 1);
    }

    #[test]
    fn governance_rejects_high_turbulence() {
        let mut state = sample_state();
        state.turbulence = 0.95;

        let result = IntentVectorBuilder::new(sample_vector())
            .with_cognitive_state(state)
            .with_metadata(sample_metadata())
            .with_provenance(sample_provenance())
            .build();

        assert_eq!(result, Err(GovernanceRejection::InspiraRejected));
    }

    #[test]
    fn governance_rejects_missing_audit_clearance() {
        let mut provenance = sample_provenance();
        provenance.audit_clearance = false;

        let result = IntentVectorBuilder::new(sample_vector())
            .with_cognitive_state(sample_state())
            .with_metadata(sample_metadata())
            .with_provenance(provenance)
            .build();

        assert_eq!(result, Err(GovernanceRejection::AuditRejected));
    }
}
