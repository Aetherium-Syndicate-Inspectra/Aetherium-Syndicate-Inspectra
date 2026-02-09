use std::array;
use std::cell::UnsafeCell;
use std::mem::MaybeUninit;
use std::sync::atomic::{AtomicBool, AtomicU64, AtomicUsize, Ordering};
use std::time::{SystemTime, UNIX_EPOCH};

pub const INTENT_DIMENSIONS: usize = 1024;
pub const ENTROPY_SEED_BYTES: usize = 32;

static LAMPORT_CLOCK: AtomicU64 = AtomicU64::new(0);

const HUGE_PAGE_BYTES: usize = 2 * 1024 * 1024;

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

        values
            .into_iter()
            .all(|value| (-1.0..=1.0).contains(&value))
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

#[repr(u8)]
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GovernanceDecision {
    Accepted = 0,
    InspiraRejected = 1,
    FirmaRejected = 2,
    AuditRejected = 3,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct ReplayRecord {
    pub sync_id: u64,
    pub entropy_seed: [u8; ENTROPY_SEED_BYTES],
    pub decision: GovernanceDecision,
}

#[derive(Debug, Clone)]
pub struct ShadowLedgerEntry {
    pub sync_id: u64,
    pub speculative_hash: u64,
    pub committed: bool,
}

#[derive(Debug, Default)]
pub struct GhostWorkerSafetyLedger {
    entries: Vec<ShadowLedgerEntry>,
}

impl GhostWorkerSafetyLedger {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn push_speculative(&mut self, sync_id: u64, speculative_hash: u64) {
        self.entries.push(ShadowLedgerEntry {
            sync_id,
            speculative_hash,
            committed: false,
        });
    }

    pub fn confirm_commit(&mut self, sync_id: u64) -> bool {
        if let Some(entry) = self
            .entries
            .iter_mut()
            .find(|entry| entry.sync_id == sync_id && !entry.committed)
        {
            entry.committed = true;
            return true;
        }

        false
    }

    pub fn committed_count(&self) -> usize {
        self.entries.iter().filter(|entry| entry.committed).count()
    }
}

#[derive(Debug, Default)]
pub struct DeterministicReplayLog {
    records: Vec<ReplayRecord>,
}

impl DeterministicReplayLog {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn push(&mut self, vector: &IntentVectorV2, decision: GovernanceDecision) {
        self.records.push(ReplayRecord {
            sync_id: vector.sync_id(),
            entropy_seed: vector.metadata().entropy_seed,
            decision,
        });
    }

    pub fn records(&self) -> &[ReplayRecord] {
        &self.records
    }
}

#[derive(Debug)]
pub struct HugePageEnvelopePool {
    slots: Vec<IntentVectorV2>,
    cursor: usize,
}

impl HugePageEnvelopePool {
    pub fn with_capacity(capacity: usize, seed: IntentVectorV2) -> Self {
        let slots = vec![seed; capacity.max(1)];
        Self { slots, cursor: 0 }
    }

    pub fn capacity(&self) -> usize {
        self.slots.len()
    }

    pub fn approx_hugepage_blocks(&self) -> usize {
        (self.capacity() * IntentVectorV2::size_in_bytes()).div_ceil(HUGE_PAGE_BYTES)
    }

    pub fn checkout(&mut self) -> &mut IntentVectorV2 {
        let idx = self.cursor;
        self.cursor = (self.cursor + 1) % self.slots.len();
        &mut self.slots[idx]
    }
}

pub struct SpmcRingBuffer<T, const CAPACITY: usize> {
    slots: [UnsafeCell<MaybeUninit<T>>; CAPACITY],
    ready: [AtomicBool; CAPACITY],
    head: AtomicUsize,
    tail: AtomicUsize,
}

unsafe impl<T: Send, const CAPACITY: usize> Send for SpmcRingBuffer<T, CAPACITY> {}
unsafe impl<T: Send, const CAPACITY: usize> Sync for SpmcRingBuffer<T, CAPACITY> {}

impl<T, const CAPACITY: usize> SpmcRingBuffer<T, CAPACITY> {
    pub fn new() -> Self {
        assert!(CAPACITY > 1, "capacity must be > 1");
        Self {
            slots: array::from_fn(|_| UnsafeCell::new(MaybeUninit::uninit())),
            ready: array::from_fn(|_| AtomicBool::new(false)),
            head: AtomicUsize::new(0),
            tail: AtomicUsize::new(0),
        }
    }

    pub fn push(&self, value: T) -> Result<(), T> {
        let head = self.head.load(Ordering::Relaxed);
        let next = (head + 1) % CAPACITY;
        if next == self.tail.load(Ordering::Acquire) {
            return Err(value);
        }

        let slot = head;
        // SAFETY: single producer writes each slot only when not ready and before publication.
        unsafe {
            (*self.slots[slot].get()).write(value);
        }
        self.ready[slot].store(true, Ordering::Release);
        self.head.store(next, Ordering::Release);
        Ok(())
    }

    pub fn pop(&self) -> Option<T> {
        loop {
            let tail = self.tail.load(Ordering::Acquire);
            if tail == self.head.load(Ordering::Acquire) {
                return None;
            }

            let next = (tail + 1) % CAPACITY;
            if self
                .tail
                .compare_exchange(tail, next, Ordering::AcqRel, Ordering::Acquire)
                .is_err()
            {
                continue;
            }

            while !self.ready[tail].load(Ordering::Acquire) {
                std::hint::spin_loop();
            }

            self.ready[tail].store(false, Ordering::Release);
            // SAFETY: this consumer has uniquely claimed this tail slot.
            let value = unsafe { (*self.slots[tail].get()).assume_init_read() };
            return Some(value);
        }
    }
}

impl<T, const CAPACITY: usize> Drop for SpmcRingBuffer<T, CAPACITY> {
    fn drop(&mut self) {
        while self.pop().is_some() {}
    }
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

pub fn governance_decision(vector: &IntentVectorV2) -> GovernanceDecision {
    if inspira_check(vector).is_err() {
        return GovernanceDecision::InspiraRejected;
    }

    if firma_check(vector).is_err() {
        return GovernanceDecision::FirmaRejected;
    }

    if audit_gate(vector).is_err() {
        return GovernanceDecision::AuditRejected;
    }

    GovernanceDecision::Accepted
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
    let has_invalid_vector_entry = has_invalid_intent_values(vector.intent_vector());

    if has_invalid_vector_entry {
        return Err(GovernanceRejection::FirmaRejected);
    }

    Ok(())
}

#[inline]
fn has_invalid_intent_values(vector: &[f32; INTENT_DIMENSIONS]) -> bool {
    #[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
    {
        if std::arch::is_x86_feature_detected!("avx2") {
            // SAFETY: guarded by runtime CPU feature detection.
            return unsafe { has_invalid_intent_values_avx2(vector) };
        }
    }

    #[cfg(target_arch = "aarch64")]
    {
        if std::arch::is_aarch64_feature_detected!("neon") {
            // SAFETY: guarded by runtime CPU feature detection.
            return unsafe { has_invalid_intent_values_neon(vector) };
        }
    }

    has_invalid_intent_values_scalar(vector)
}

#[inline]
fn has_invalid_intent_values_scalar(vector: &[f32; INTENT_DIMENSIONS]) -> bool {
    vector
        .iter()
        .any(|value| !value.is_finite() || value.abs() > 1.0)
}

#[cfg(any(target_arch = "x86", target_arch = "x86_64"))]
#[target_feature(enable = "avx2")]
unsafe fn has_invalid_intent_values_avx2(vector: &[f32; INTENT_DIMENSIONS]) -> bool {
    #[cfg(target_arch = "x86")]
    use std::arch::x86::*;
    #[cfg(target_arch = "x86_64")]
    use std::arch::x86_64::*;

    let ones = _mm256_set1_ps(1.0);
    let abs_mask = _mm256_castsi256_ps(_mm256_set1_epi32(0x7FFF_FFFFu32 as i32));

    for chunk in vector.chunks_exact(8) {
        let values = _mm256_loadu_ps(chunk.as_ptr());
        let abs_values = _mm256_and_ps(values, abs_mask);
        let above_limit = _mm256_cmp_ps(abs_values, ones, _CMP_GT_OQ);
        let unordered = _mm256_cmp_ps(values, values, _CMP_UNORD_Q);
        let bad = _mm256_or_ps(above_limit, unordered);
        if _mm256_movemask_ps(bad) != 0 {
            return true;
        }
    }

    false
}

#[cfg(target_arch = "aarch64")]
#[target_feature(enable = "neon")]
unsafe fn has_invalid_intent_values_neon(vector: &[f32; INTENT_DIMENSIONS]) -> bool {
    use std::arch::aarch64::*;

    let ones = vdupq_n_f32(1.0);
    let sign_clear = vdupq_n_u32(0x7FFF_FFFF);

    for chunk in vector.chunks_exact(4) {
        let values = vld1q_f32(chunk.as_ptr());
        let abs_values =
            vreinterpretq_f32_u32(vandq_u32(vreinterpretq_u32_f32(values), sign_clear));
        let above = vcgtq_f32(abs_values, ones);
        let finite = vceqq_f32(values, values);
        let invalid_nan = vmvnq_u32(finite);
        let invalid = vorrq_u32(above, invalid_nan);
        if vmaxvq_u32(invalid) != 0 {
            return true;
        }
    }

    false
}

pub fn normalize_intent_vector(input: &[f32; INTENT_DIMENSIONS]) -> [f32; INTENT_DIMENSIONS] {
    let mut out = [0.0; INTENT_DIMENSIONS];
    for (idx, value) in input.iter().enumerate() {
        out[idx] = value.clamp(-1.0, 1.0);
    }
    out
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
    use std::sync::Arc;
    use std::thread;

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

    #[test]
    fn deterministic_replay_log_persists_seed_sync_and_decision() {
        let envelope = IntentVectorBuilder::new(sample_vector())
            .with_cognitive_state(sample_state())
            .with_metadata(sample_metadata())
            .with_provenance(sample_provenance())
            .build()
            .expect("should pass governance");

        let mut replay = DeterministicReplayLog::new();
        replay.push(&envelope, governance_decision(&envelope));

        let row = replay.records().first().expect("one row");
        assert_eq!(row.sync_id, envelope.sync_id());
        assert_eq!(row.entropy_seed, envelope.metadata().entropy_seed);
        assert_eq!(row.decision, GovernanceDecision::Accepted);
    }

    #[test]
    fn ghost_worker_ledger_keeps_speculative_until_confirmation() {
        let mut ledger = GhostWorkerSafetyLedger::new();
        ledger.push_speculative(10, 0xABCD);
        ledger.push_speculative(11, 0xBCDE);

        assert_eq!(ledger.committed_count(), 0);
        assert!(ledger.confirm_commit(11));
        assert_eq!(ledger.committed_count(), 1);
        assert!(!ledger.confirm_commit(77));
    }

    #[test]
    fn ring_buffer_supports_single_producer_multi_consumer() {
        let ring = Arc::new(SpmcRingBuffer::<u64, 128>::new());
        let expected_sum: u64 = (0..64).sum();

        for value in 0..64 {
            ring.push(value).expect("ring has capacity");
        }

        let mut handles = Vec::new();
        for _ in 0..4 {
            let ring_clone = Arc::clone(&ring);
            handles.push(thread::spawn(move || {
                let mut local_sum = 0u64;
                while let Some(value) = ring_clone.pop() {
                    local_sum += value;
                }
                local_sum
            }));
        }

        let consumed_sum: u64 = handles
            .into_iter()
            .map(|handle| handle.join().expect("thread should join"))
            .sum();

        assert_eq!(consumed_sum, expected_sum);
    }

    #[test]
    fn envelope_pool_reuses_preallocated_slots() {
        let seed = IntentVectorBuilder::new(sample_vector())
            .with_cognitive_state(sample_state())
            .with_metadata(sample_metadata())
            .with_provenance(sample_provenance())
            .build()
            .expect("seed should pass");

        let mut pool = HugePageEnvelopePool::with_capacity(8, seed);
        assert_eq!(pool.capacity(), 8);
        assert!(pool.approx_hugepage_blocks() >= 1);

        let slot = pool.checkout();
        assert!(slot.frozen());
    }

    #[test]
    fn normalize_vector_clamps_outliers() {
        let mut vector = sample_vector();
        vector[4] = -3.0;
        vector[7] = 5.5;
        let normalized = normalize_intent_vector(&vector);
        assert_eq!(normalized[4], -1.0);
        assert_eq!(normalized[7], 1.0);
    }
}
