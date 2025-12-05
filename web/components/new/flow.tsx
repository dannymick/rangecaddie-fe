"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WheelSelect } from "@/components/ui/wheel-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CLUB_TYPES,
  DISTANCE_BANDS,
  DISPERSION_BANDS,
  SHOT_RESULTS,
  SHOT_FLIGHTS,
  TRAJECTORIES,
  SWING_PATHS,
  clubTypeLabel,
  distanceBandLabel,
  dispersionBandLabel,
  shotFlightLabel,
  type DistanceBandValue,
  type DispersionBandValue,
  type DispersionDirectionValue,
  type ShotFlightValue,
  type TrajectoryValue,
  type SwingPathValue,
} from "@/lib/enums";
import { useUserClubs } from "@/lib/clubs";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { addSession, removeSession, setLastSessionId } from "@/lib/sessions";
import { useRouter } from "next/navigation";
import { useCreateSession, useDeleteSession } from "@/hooks/useSessions";
import { useCreateOrUpdatePostShot, useCreatePreShot } from "@/hooks/useShots";
import type { PreShotInput, PostShotInput } from "@/types/api";

type Mode = "short" | "long" | "free" | "putting";
type Step = "mode" | "pre" | "post" | "finish";

const LOCAL_DISPERSION_DIRECTIONS = ["Left", "Center", "Right"] as const;

// Shot flight options provided by server enum

export function FlowModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("mode");
  const [mode, setMode] = useState<Mode | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [closing, setClosing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [shotId, setShotId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Sub-step indices for Pre and Post
  const PRE_STEPS_COUNT = 6;
  const POST_STEPS_COUNT = 7; // includes Notes (skippable)
  const [preIdx, setPreIdx] = useState(0);
  const [postIdx, setPostIdx] = useState(0);

  // Pre fields (non-putting)
  const [club, setClub] = useState("");
  const [intendedDistance, setIntendedDistance] = useState("");
  const [intendedFlight, setIntendedFlight] = useState<"" | ShotFlightValue>(
    ""
  );
  const [intendedDispersion, setIntendedDispersion] = useState("");
  const [intendedTrajectory, setIntendedTrajectory] = useState<
    "" | TrajectoryValue
  >("");
  const [intendedSwingPath, setIntendedSwingPath] = useState<
    "" | SwingPathValue
  >("");

  // Post fields (non-putting)
  const [actualFlight, setActualFlight] = useState<"" | ShotFlightValue>("");
  const [actualDistance, setActualDistance] = useState<"" | DistanceBandValue>(
    ""
  );
  const [actualDispersion, setActualDispersion] = useState<
    "" | DispersionBandValue
  >("");
  const [dispersionDirection, setDispersionDirection] =
    useState<DispersionDirectionValue>("Center");
  const [actualTrajectory, setActualTrajectory] = useState<
    "" | TrajectoryValue
  >("");
  const [actualSwingPath, setActualSwingPath] = useState<"" | SwingPathValue>(
    ""
  );
  const [resultTag, setResultTag] = useState<
    "" | (typeof SHOT_RESULTS)[number]
  >("");
  const [note, setNote] = useState("");

  // Putting fields
  const [puttDistance, setPuttDistance] = useState("");
  const [breakInt, setBreakInt] = useState<"Left" | "Right" | "Straight" | "">(
    ""
  );
  const [speedInt, setSpeedInt] = useState<"Die-in" | "Firm" | "">("");
  const [made, setMade] = useState<boolean | null>(null);
  const [missSide, setMissSide] = useState<
    "Short" | "Long" | "Left" | "Right" | "High" | "Low" | ""
  >("");
  const [missDistance, setMissDistance] = useState("");

  // Create a session on first entry into pre-step
  const sessionCreatedRef = useRef(false);
  const createSession = useCreateSession();
  const deleteSession = useDeleteSession();
  useEffect(() => {
    if (step === "pre" && !sessionCreatedRef.current) {
      sessionCreatedRef.current = true;
      (async () => {
        try {
          setBusy(true);
          setError(null);
          const s = await createSession.mutateAsync();
          setSessionId(s.id);
        } catch (e) {
          const msg =
            e && typeof e === "object" && "message" in e
              ? (e as any).message
              : "Failed to create session";
          setError(String(msg));
        } finally {
          setBusy(false);
        }
      })();
    }
  }, [step]);

  const stepIndex = useMemo(() => {
    switch (step) {
      case "mode":
        return 1;
      case "pre":
        return 2;
      case "post":
        return 3;
      case "finish":
        return 4;
    }
  }, [step]);

  const totalSteps = 4;

  function canAdvance(step: Step, pre: number, post: number) {
    if (step === "mode") return !!mode;
    if (step === "pre") {
      // Validate current pre field has a value
      switch (pre) {
        case 0:
          return !!club;
        case 1:
          return !!intendedDistance;
        case 2:
          return !!intendedFlight;
        case 3:
          return !!intendedDispersion;
        case 4:
          return !!intendedTrajectory;
        case 5:
          return !!intendedSwingPath;
        default:
          return false;
      }
    }
    if (step === "post") {
      switch (post) {
        case 0:
          return !!actualDistance;
        case 1:
          return !!actualDispersion;
        case 2:
          return !!actualFlight;
        case 3:
          return !!actualTrajectory;
        case 4:
          return !!actualSwingPath;
        case 5:
          return true; // Result optional
        case 6:
          return true; // Notes skippable
        default:
          return false;
      }
    }
    return true;
  }

  const preShotMutation = useCreatePreShot();
  const postShotMutation = useCreateOrUpdatePostShot();

  async function next() {
    if (step === "mode") {
      setStep("pre");
      return;
    }
    if (step === "pre") {
      // Advance within Pre sub-steps or complete pre-shot
      if (preIdx < PRE_STEPS_COUNT - 1) {
        setPreIdx((i) => i + 1);
        return;
      }
      await completePre();
      // Reset index for next time
      setPreIdx(0);
      return;
    }
    if (step === "post") {
      if (postIdx < POST_STEPS_COUNT - 1) {
        setPostIdx((i) => i + 1);
        return;
      }
      await completePost();
      setPostIdx(0);
      return;
    }
  }

  async function completePre() {
    if (mode === "putting") {
      setStep("post");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      let sid = sessionId;
      if (!sid) {
        const s = await createSession.mutateAsync();
        sid = s.id;
        setSessionId(sid);
      }
      if (!sid) throw new Error("No session available");
      const body: PreShotInput = {};
      if (club) body.club = club;
      if (intendedFlight) body.intendedFlight = intendedFlight as any;
      if (intendedTrajectory)
        body.intendedTrajectory = intendedTrajectory as any;
      if (intendedDispersion)
        body.intendedDispersion = intendedDispersion as any;
      if (intendedDistance) body.target = intendedDistance;
      const shot = await preShotMutation.mutateAsync({ sessionId: sid, body });
      setShotId(shot.id);
      setStep("post");
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? (e as any).message
          : "Failed to save pre-shot";
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  }

  async function completePost() {
    if (mode === "putting") {
      setStep("finish");
      return;
    }
    try {
      setBusy(true);
      setError(null);
      if (!shotId) throw new Error("No shot to update");
      const body: PostShotInput = {};
      if (actualFlight) body.actualFlight = actualFlight as any;
      if (actualTrajectory) {
        body.trajectory = actualTrajectory as any;
        body.actualTrajectory = actualTrajectory as any;
      }
      if (actualDistance) body.distanceBand = actualDistance as any;
      if (actualDispersion) body.dispersionBand = actualDispersion as any;
      if (dispersionDirection) {
        body.dispersionDirection = dispersionDirection.toUpperCase() as any;
      }
      if (actualSwingPath) body.swingPath = actualSwingPath as any;
      if (resultTag) {
        const normalized = resultTag.toUpperCase();
        if (["PURE", "THIN", "FAT", "TOE", "HEEL"].includes(normalized)) {
          body.contact = normalized as any;
          if (normalized === "THIN" || normalized === "PURE") {
            body.resultEnum = normalized as any;
          }
          if (normalized === "FAT") {
            body.resultEnum = "CHUNK" as any;
          }
        } else {
          body.result = resultTag;
        }
      }
      if (note) body.note = note;
      await postShotMutation.mutateAsync({
        shotId,
        body,
        sessionId: sessionId ?? undefined,
      });
      setStep("finish");
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? (e as any).message
          : "Failed to save post-shot";
      setError(String(msg));
    } finally {
      setBusy(false);
    }
  }

  function back() {
    if (step === "post") {
      if (postIdx > 0) setPostIdx((i) => i - 1);
      else setStep("pre");
    } else if (step === "pre") {
      if (preIdx > 0) setPreIdx((i) => i - 1);
      else setStep("mode");
    }
  }

  function resetForAnotherShot() {
    setStep("pre");
    setActualDistance("");
    setActualDispersion("");
    setActualFlight("");
    setDispersionDirection("Center");
    setResultTag("");
    setNote("");
    setPuttDistance("");
    setBreakInt("");
    setSpeedInt("");
    setMade(null);
    setMissSide("");
    setMissDistance("");
  }

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    const timeout = 180;
    window.setTimeout(() => onClose(), timeout);
  }, [closing, onClose]);

  const handleCancelSession = useCallback(async () => {
    if (closing) return;
    if (!sessionId) {
      requestClose();
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await deleteSession.mutateAsync(sessionId);
      removeSession(sessionId);
      requestClose();
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? (e as any).message
          : "Failed to delete session";
      setError(String(msg));
      return;
    } finally {
      setBusy(false);
    }
  }, [closing, sessionId, deleteSession, requestClose]);

  const closeToStats = (sessionId: string) => {
    if (closing) return;
    setClosing(true);
    const timeout = 180;
    window.setTimeout(() => {
      router.replace(`/?tab=stats&session=${encodeURIComponent(sessionId)}`, {
        scroll: false,
      });
    }, timeout);
  };

  // ESC key to close or dismiss confirm dialog first
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (confirmCancel) {
          setConfirmCancel(false);
        } else {
          void handleCancelSession();
        }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [confirmCancel, handleCancelSession]);

  return (
    <div
      className={`fixed inset-0 z-50 bg-background/80 backdrop-blur ${
        closing ? "animate-fade-out pointer-events-none" : "animate-fade-in"
      }`}
    >
      <div
        className={`mx-auto max-w-screen-sm h-dvh flex flex-col ${
          closing ? "animate-content-out" : "animate-content-in"
        }`}
      >
        {/* Header */}
        <header className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <h1 className="text-base font-semibold">New Range Session</h1>
            <p className="text-xs text-muted-foreground">
              Step {stepIndex} of {totalSteps}
            </p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setConfirmCancel(true)}
          >
            Cancel
          </Button>
        </header>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {error ? (
            <p className="mb-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          ) : null}
          {step === "mode" && (
            <ModeStep value={mode} onChange={(m) => setMode(m)} />
          )}

          {(step === "pre" || step === "post") && (
            <div className="mb-3 flex items-center gap-2 text-sm">
              <span
                className={
                  step === "pre"
                    ? "font-semibold text-green-700"
                    : "text-muted-foreground"
                }
              >
                Pre shot
              </span>
              <span className="text-muted-foreground">/</span>
              <span
                className={
                  step === "post"
                    ? "font-semibold text-green-700"
                    : "text-muted-foreground"
                }
              >
                Post shot
              </span>
            </div>
          )}

          {step === "pre" &&
            (mode === "putting" ? (
              <PuttingPreStep
                value={{ puttDistance, breakInt, speedInt }}
                onChange={({ puttDistance: d, breakInt: b, speedInt: s }) => {
                  setPuttDistance(d);
                  setBreakInt(b);
                  setSpeedInt(s);
                }}
              />
            ) : (
              <PreStep
                value={{
                  club,
                  intendedDistance,
                  intendedFlight,
                  intendedTrajectory,
                  intendedSwingPath,
                  intendedDispersion,
                }}
                onChange={({
                  club: c,
                  intendedDistance: d,
                  intendedFlight: f,
                  intendedTrajectory: tj,
                  intendedSwingPath: sp,
                  intendedDispersion: di,
                }) => {
                  setClub(c);
                  setIntendedDistance(d);
                  setIntendedFlight(f);
                  setIntendedTrajectory(tj);
                  setIntendedSwingPath(sp);
                  setIntendedDispersion(di);
                }}
                index={preIdx}
                total={PRE_STEPS_COUNT}
              />
            ))}

          {step === "post" &&
            (mode === "putting" ? (
              <PuttingPostStep
                value={{ made, missSide, missDistance, note }}
                onChange={({
                  made: m,
                  missSide: s,
                  missDistance: dist,
                  note: n,
                }) => {
                  setMade(m);
                  setMissSide(s);
                  setMissDistance(dist);
                  setNote(n);
                }}
              />
            ) : (
              <PostStep
                value={{
                  actualFlight,
                  actualTrajectory,
                  actualSwingPath,
                  actualDistance,
                  actualDispersion,
                  dispersionDirection,
                  resultTag,
                  note,
                }}
                onChange={({
                  actualFlight: f,
                  actualTrajectory: tj,
                  actualSwingPath: sp,
                  actualDistance: d,
                  actualDispersion: di,
                  dispersionDirection: dir,
                  resultTag: r,
                  note: n,
                }) => {
                  setActualFlight(f);
                  setActualTrajectory(tj);
                  setActualSwingPath(sp);
                  setActualDistance(d);
                  setActualDispersion(di);
                  setDispersionDirection(dir);
                  setResultTag(r);
                  setNote(n);
                }}
                index={postIdx}
                total={POST_STEPS_COUNT}
              />
            ))}

          {step === "finish" && (
            <FinishStep
              isPutting={mode === "putting"}
              club={club}
              // Pre
              intendedFlight={intendedFlight}
              intendedDistance={intendedDistance as any}
              intendedDispersion={intendedDispersion as any}
              // Post
              actualFlight={actualFlight}
              actualDistance={actualDistance}
              actualDispersion={actualDispersion}
              dispersionDirection={dispersionDirection}
              resultTag={resultTag}
              onAddAnother={resetForAnotherShot}
              onDone={() => {
                // Save a minimal session summary and navigate to Stats after close
                const id = sessionId ?? `s${Date.now()}`;
                const baseTitle = mode
                  ? `${mode[0].toUpperCase()}${mode.slice(1)} session`
                  : "Range session";
                const title = club
                  ? `${clubTypeLabel(club as any)} • ${baseTitle}`
                  : baseTitle;
                addSession({
                  id,
                  date: new Date().toISOString(),
                  mode: (mode ?? "free") as any,
                  title,
                  shots: 1,
                });
                setLastSessionId(id);
                closeToStats(id);
              }}
            />
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-2 px-4 py-3 border-t">
          <Button
            variant="ghost"
            onClick={back}
            disabled={step === "mode" || busy}
          >
            Back
          </Button>
          <div className="flex gap-2">
            {step !== "finish" && (
              <Button
                onClick={() => {
                  // trigger pre/post create
                  void next();
                }}
                disabled={
                  (step === "mode" && !mode) ||
                  !canAdvance(step, preIdx, postIdx) ||
                  busy
                }
              >
                {busy ? "Saving…" : "Next"}
              </Button>
            )}
          </div>
        </footer>

        {/* Cancel confirm */}
        {confirmCancel && (
          <ConfirmDialog
            title="Discard session?"
            description="You will lose any unsaved progress."
            onCancel={() => setConfirmCancel(false)}
            onConfirm={() => {
              setConfirmCancel(false);
              void handleCancelSession();
            }}
          />
        )}
      </div>
    </div>
  );
}

function ModeStep({
  value,
  onChange,
}: {
  value: Mode | null;
  onChange: (m: Mode) => void;
}) {
  const options: { key: Mode; label: string; desc: string }[] = [
    { key: "free", label: "Free session", desc: "No specific focus" },
    { key: "long", label: "Long game", desc: "≥ 150 yards" },
    { key: "short", label: "Short game", desc: "< 150 yards" },
    { key: "putting", label: "Putting", desc: "Greens work" },
  ];
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">What are you working on today?</h2>
      <div className="grid grid-cols-1 gap-3">
        {options.map((o) => (
          <button
            key={o.key}
            onClick={() => onChange(o.key)}
            className={`rounded-lg border p-3 text-left transition-colors cursor-pointer ${
              value === o.key
                ? "border-primary ring-2 ring-ring"
                : "hover:bg-muted/50"
            }`}
            aria-pressed={value === o.key}
          >
            <div className="font-medium">{o.label}</div>
            <div className="text-xs text-muted-foreground">{o.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepProgress({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1" aria-label="progress">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded ${
            i < current ? "bg-green-600" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );
}

function OptionButtons({
  value,
  options,
  onChange,
}: {
  value: string | "";
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((o) => (
        <Button
          key={o.value}
          size="md"
          variant={value === o.value ? "secondary" : "ghost"}
          className="w-full justify-start"
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </Button>
      ))}
    </div>
  );
}

function PreStep({
  value,
  onChange,
  index,
  total,
}: {
  value: {
    club: string;
    intendedDistance: string;
    intendedFlight: ShotFlightValue | "";
    intendedTrajectory: TrajectoryValue | "";
    intendedSwingPath: SwingPathValue | "";
    intendedDispersion: string;
  };
  onChange: (v: {
    club: string;
    intendedDistance: string;
    intendedFlight: ShotFlightValue | "";
    intendedTrajectory: TrajectoryValue | "";
    intendedSwingPath: SwingPathValue | "";
    intendedDispersion: string;
  }) => void;
  index: number;
  total: number;
}) {
  const { clubs: clubOptions } = useUserClubs();
  // Prepare club options for range mode: remove PUTTER and put DRIVER on top
  const processedClubs = (() => {
    const raw = (clubOptions as readonly string[]) || [];
    const filtered = raw.filter((c) => c !== "PUTTER");
    const idx = filtered.indexOf("DRIVER");
    if (idx > 0) {
      const copy = filtered.slice();
      const [d] = copy.splice(idx, 1);
      copy.unshift(d);
      return copy;
    }
    return filtered;
  })();
  const steps = [
    {
      key: "club",
      label: "Club",
      render: () => (
        <WheelSelect
          id="club"
          infinite={false}
          label="Club"
          placeholder="Select club"
          value={value.club}
          onChange={(v) => onChange({ ...value, club: v })}
          options={processedClubs.map((c) => ({
            value: c,
            label: clubTypeLabel(c as any),
          }))}
        />
      ),
    },
    {
      key: "distance",
      label: "Target Distance",
      render: () => (
        <WheelSelect
          id="target"
          infinite={false}
          label="Target Distance"
          placeholder="Select distance"
          value={value.intendedDistance}
          onChange={(v) => onChange({ ...value, intendedDistance: v })}
          options={DISTANCE_BANDS.map((b) => ({
            value: b,
            label: distanceBandLabel(b),
          }))}
        />
      ),
    },
    {
      key: "flight",
      label: "Intended Flight",
      render: () => (
        <OptionButtons
          value={value.intendedFlight}
          onChange={(v) =>
            onChange({ ...value, intendedFlight: v as ShotFlightValue })
          }
          options={SHOT_FLIGHTS.map((f) => ({
            value: f,
            label: shotFlightLabel(f),
          }))}
        />
      ),
    },
    {
      key: "dispersion",
      label: "Intended Dispersion",
      render: () => (
        <WheelSelect
          id="idisp"
          infinite={false}
          label="Intended Dispersion"
          value={value.intendedDispersion}
          onChange={(v) => onChange({ ...value, intendedDispersion: v })}
          options={DISPERSION_BANDS.map((d) => ({
            value: d,
            label: dispersionBandLabel(d),
          }))}
        />
      ),
    },
    {
      key: "trajectory",
      label: "Intended Trajectory",
      render: () => (
        <OptionButtons
          value={value.intendedTrajectory}
          onChange={(v) =>
            onChange({ ...value, intendedTrajectory: v as TrajectoryValue })
          }
          options={TRAJECTORIES.map((t) => ({
            value: t,
            label: t.charAt(0) + t.slice(1).toLowerCase(),
          }))}
        />
      ),
    },
    {
      key: "swing",
      label: "Intended Swing Path",
      render: () => (
        <OptionButtons
          value={value.intendedSwingPath}
          onChange={(v) =>
            onChange({ ...value, intendedSwingPath: v as SwingPathValue })
          }
          options={SWING_PATHS.map((p) => ({ value: p, label: p }))}
        />
      ),
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* <h2 className="text-lg font-medium">Pre-shot intention</h2> */}
        <span className="text-xs text-muted-foreground">
          {steps[index].label}
        </span>
      </div>
      <StepProgress current={index + 1} total={total} />
      <div className="mt-2">{steps[index].render()}</div>
    </div>
  );
}

function PostStep({
  value,
  onChange,
  index,
  total,
}: {
  value: {
    actualFlight: ShotFlightValue | "";
    actualTrajectory: TrajectoryValue | "";
    actualSwingPath: SwingPathValue | "";
    actualDistance: "" | DistanceBandValue;
    actualDispersion: "" | DispersionBandValue;
    dispersionDirection: DispersionDirectionValue;
    resultTag: "" | (typeof SHOT_RESULTS)[number];
    note: string;
  };
  onChange: (v: {
    actualFlight: ShotFlightValue | "";
    actualTrajectory: TrajectoryValue | "";
    actualSwingPath: SwingPathValue | "";
    actualDistance: "" | DistanceBandValue;
    actualDispersion: "" | DispersionBandValue;
    dispersionDirection: DispersionDirectionValue;
    resultTag: "" | (typeof SHOT_RESULTS)[number];
    note: string;
  }) => void;
  index: number;
  total: number;
}) {
  const steps = [
    {
      key: "distance",
      label: "Distance",
      render: () => (
        <WheelSelect
          id="adist"
          infinite={false}
          label="Distance"
          placeholder="Select distance"
          value={value.actualDistance}
          onChange={(v) =>
            onChange({ ...value, actualDistance: v as DistanceBandValue })
          }
          options={DISTANCE_BANDS.map((b) => ({
            value: b,
            label: distanceBandLabel(b),
          }))}
        />
      ),
      val: () => value.actualDistance,
    },
    {
      key: "dispersion",
      label: "Dispersion",
      render: () => (
        <div className="space-y-3">
          <WheelSelect
            id="adisp"
            infinite={false}
            label="Dispersion"
            placeholder="Select dispersion"
            value={value.actualDispersion}
            onChange={(v) =>
              onChange({ ...value, actualDispersion: v as DispersionBandValue })
            }
            options={DISPERSION_BANDS.map((d) => ({
              value: d,
              label: dispersionBandLabel(d),
            }))}
          />
          <h3>Direction</h3>
          <Tabs
            value={value.dispersionDirection}
            onValueChange={(v) =>
              onChange({
                ...value,
                dispersionDirection: v as DispersionDirectionValue,
              })
            }
          >
            <TabsList className="gap-2 w-full">
              {LOCAL_DISPERSION_DIRECTIONS.map((dir) => (
                <TabsTrigger key={dir} value={dir} className="flex-1">
                  {dir}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      ),
      val: () => value.actualDispersion,
    },
    {
      key: "flight",
      label: "Flight",
      render: () => (
        <OptionButtons
          value={value.actualFlight}
          onChange={(v) =>
            onChange({ ...value, actualFlight: v as ShotFlightValue })
          }
          options={SHOT_FLIGHTS.map((f) => ({
            value: f,
            label: shotFlightLabel(f),
          }))}
        />
      ),
      val: () => value.actualFlight,
    },
    {
      key: "trajectory",
      label: "Trajectory",
      render: () => (
        <OptionButtons
          value={value.actualTrajectory}
          onChange={(v) =>
            onChange({ ...value, actualTrajectory: v as TrajectoryValue })
          }
          options={TRAJECTORIES.map((t) => ({
            value: t,
            label: t.charAt(0) + t.slice(1).toLowerCase(),
          }))}
        />
      ),
      val: () => value.actualTrajectory,
    },
    {
      key: "path",
      label: "Swing Path",
      render: () => (
        <OptionButtons
          value={value.actualSwingPath}
          onChange={(v) =>
            onChange({ ...value, actualSwingPath: v as SwingPathValue })
          }
          options={SWING_PATHS.map((p) => ({ value: p, label: p }))}
        />
      ),
      val: () => value.actualSwingPath,
    },
    {
      key: "result",
      label: "Result (optional)",
      render: () => (
        <OptionButtons
          value={value.resultTag}
          onChange={(v) => onChange({ ...value, resultTag: v as any })}
          options={SHOT_RESULTS.map((r) => ({ value: r, label: r }))}
        />
      ),
      val: () => value.resultTag,
    },
    {
      key: "notes",
      label: "Notes (optional)",
      render: () => (
        <div className="grid gap-2">
          <Label htmlFor="note">Note</Label>
          <textarea
            id="note"
            className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm"
            value={value.note}
            onChange={(e) => onChange({ ...value, note: e.target.value })}
          />
        </div>
      ),
      val: () => (value.note ? "ok" : ""),
    },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">Post-shot result</h2>
        <span className="text-xs text-muted-foreground">
          {steps[index].label}
        </span>
      </div>
      <StepProgress current={index + 1} total={total} />
      <div className="mt-2">{steps[index].render()}</div>
    </div>
  );
}

function PuttingPreStep({
  value,
  onChange,
}: {
  value: {
    puttDistance: string;
    breakInt: "Left" | "Right" | "Straight" | "";
    speedInt: "Die-in" | "Firm" | "";
  };
  onChange: (v: {
    puttDistance: string;
    breakInt: "Left" | "Right" | "Straight" | "";
    speedInt: "Die-in" | "Firm" | "";
  }) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Pre-putt intention</h2>
      <div className="grid gap-3">
        <div className="grid gap-1">
          <Label htmlFor="pd">Putt Distance (ft)</Label>
          <Input
            id="pd"
            type="number"
            inputMode="numeric"
            value={value.puttDistance}
            onChange={(e) =>
              onChange({ ...value, puttDistance: e.target.value })
            }
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="break">Break intention</Label>
          <select
            id="break"
            className="h-10 rounded-md border bg-background px-3"
            value={value.breakInt}
            onChange={(e) =>
              onChange({ ...value, breakInt: e.target.value as any })
            }
          >
            <option value="">Select</option>
            {(["Left", "Right", "Straight"] as const).map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="speed">Speed intention</Label>
          <select
            id="speed"
            className="h-10 rounded-md border bg-background px-3"
            value={value.speedInt}
            onChange={(e) =>
              onChange({ ...value, speedInt: e.target.value as any })
            }
          >
            <option value="">Select</option>
            {(["Die-in", "Firm"] as const).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function PuttingPostStep({
  value,
  onChange,
}: {
  value: {
    made: boolean | null;
    missSide: "Short" | "Long" | "Left" | "Right" | "High" | "Low" | "";
    missDistance: string;
    note: string;
  };
  onChange: (v: {
    made: boolean | null;
    missSide: "Short" | "Long" | "Left" | "Right" | "High" | "Low" | "";
    missDistance: string;
    note: string;
  }) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Post-putt result</h2>
      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Made?</span>
          <div className="inline-flex gap-1">
            <Button
              size="sm"
              variant={value.made === true ? "default" : "ghost"}
              onClick={() => onChange({ ...value, made: true })}
            >
              Yes
            </Button>
            <Button
              size="sm"
              variant={value.made === false ? "default" : "ghost"}
              onClick={() => onChange({ ...value, made: false })}
            >
              No
            </Button>
          </div>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="mside">Miss side</Label>
          <select
            id="mside"
            className="h-10 rounded-md border bg-background px-3"
            value={value.missSide}
            onChange={(e) =>
              onChange({ ...value, missSide: e.target.value as any })
            }
          >
            <option value="">Select</option>
            {(["Short", "Long", "Left", "Right", "High", "Low"] as const).map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
        </div>
        <div className="grid gap-1">
          <Label htmlFor="mdist">Miss Distance (ft)</Label>
          <Input
            id="mdist"
            type="number"
            inputMode="numeric"
            value={value.missDistance}
            onChange={(e) =>
              onChange({ ...value, missDistance: e.target.value })
            }
          />
        </div>
        <div className="grid gap-1">
          <Label htmlFor="pnote">Note (optional)</Label>
          <textarea
            id="pnote"
            className="min-h-20 rounded-md border bg-background px-3 py-2 text-sm"
            value={value.note}
            onChange={(e) => onChange({ ...value, note: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

function FinishStep({
  isPutting,
  club,
  intendedFlight,
  intendedDistance,
  intendedDispersion,
  actualFlight,
  actualDistance,
  actualDispersion,
  dispersionDirection,
  resultTag,
  onAddAnother,
  onDone,
}: {
  isPutting: boolean;
  club?: string;
  intendedFlight?: ShotFlightValue | "";
  intendedDistance?: "" | DistanceBandValue;
  intendedDispersion?: "" | DispersionBandValue;
  actualFlight?: ShotFlightValue | "";
  actualDistance?: "" | DistanceBandValue;
  actualDispersion?: "" | DispersionBandValue;
  dispersionDirection?: DispersionDirectionValue;
  resultTag?: "" | (typeof SHOT_RESULTS)[number];
  onAddAnother: () => void;
  onDone: () => void;
}) {
  if (isPutting) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium">Putting mode is coming soon</h2>
        <p className="text-sm text-muted-foreground">
          We’re still building the full Putting workflow. You can explore the
          flow, but saving is disabled for now.
        </p>
        <div className="flex gap-2">
          <Button onClick={onAddAnother} variant="secondary">
            Add another shot
          </Button>
          <Button onClick={onDone}>Finish session</Button>
        </div>
      </div>
    );
  }

  // Helpers to compute deltas using band midpoints
  const parseBand = (v: string | undefined | null, prefix: "Y" | "D") => {
    if (!v) return null as null | { a: number; b: number | null };
    const m = v.match(new RegExp(`^${prefix}(\\d+)_?(\\d+)?$`));
    if (!m) return null;
    const a = Number(m[1]);
    const b = m[2] ? Number(m[2]) : null;
    return { a, b };
  };
  const midpoint = (x: { a: number; b: number | null } | null) =>
    x ? (x.b ? (x.a + x.b) / 2 : x.a) : null;
  const delta = (
    pre: string | undefined,
    post: string | undefined,
    kind: "Y" | "D"
  ) => {
    const pm = midpoint(parseBand(pre, kind));
    const am = midpoint(parseBand(post, kind));
    if (pm == null || am == null) return null as number | null;
    return Math.round(am - pm);
  };

  const distDelta = delta(intendedDistance, actualDistance, "Y");
  const dispDelta = delta(intendedDispersion, actualDispersion, "D");
  const deltaClass = (d: number | null) => {
    if (d == null) return "";
    const a = Math.abs(d);
    if (a >= 20) return "text-red-600";
    if (a <= 5) return "text-green-600";
    return "";
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">
        {club ? (
          <span className="-mb-2">
            <span className="inline-flex items-center rounded-full bg-green-600 text-black px-3 py-1 text-xs font-medium">
              {clubTypeLabel(club as any)}
            </span>
          </span>
        ) : null}
        Shot saved
      </h2>
      <p className="text-sm text-muted-foreground">
        Review your intention vs result.
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-2 pr-4">Metric</th>
              <th className="py-2 pr-4">Intended</th>
              <th className="py-2 pr-4">Actual</th>
              <th className="py-2">Δ</th>
            </tr>
          </thead>
          <tbody className="align-top">
            <tr className={`border-t`}>
              <td className="py-2 pr-4">Flight</td>
              <td className="py-2 pr-4">
                {intendedFlight ? shotFlightLabel(intendedFlight) : "—"}
              </td>
              <td className="py-2 pr-4">
                {actualFlight ? shotFlightLabel(actualFlight) : "—"}
              </td>
              <td className="py-2">
                {intendedFlight && actualFlight ? (
                  intendedFlight === actualFlight ? (
                    <ThumbsUp
                      className="inline-block text-green-600"
                      size={16}
                      aria-label="Match"
                    />
                  ) : (
                    <ThumbsDown
                      className="inline-block text-red-600"
                      size={16}
                      aria-label="Differs"
                    />
                  )
                ) : (
                  "—"
                )}
              </td>
            </tr>
            <tr className={`border-t`}>
              <td className="py-2 pr-4">Distance</td>
              <td className="py-2 pr-4">
                {intendedDistance ? distanceBandLabel(intendedDistance) : "—"}
              </td>
              <td className="py-2 pr-4">
                {actualDistance ? distanceBandLabel(actualDistance) : "—"}
              </td>
              <td className={`py-2 ${deltaClass(distDelta)}`}>
                {distDelta == null
                  ? "—"
                  : `${distDelta >= 0 ? "+" : ""}${distDelta} yd`}
              </td>
            </tr>
            <tr className={`border-t`}>
              <td className="py-2 pr-4">Dispersion</td>
              <td className="py-2 pr-4">
                {intendedDispersion
                  ? dispersionBandLabel(intendedDispersion)
                  : "—"}
              </td>
              <td className="py-2 pr-4">
                {actualDispersion ? dispersionBandLabel(actualDispersion) : "—"}
              </td>
              <td className={`py-2 ${deltaClass(dispDelta)}`}>
                {dispDelta == null
                  ? "—"
                  : `${dispDelta >= 0 ? "+" : ""}${dispDelta} yd`}
              </td>
            </tr>
            <tr className={`border-t`}>
              <td className="py-2 pr-4">Direction</td>
              <td className="py-2 pr-4">—</td>
              <td className="py-2 pr-4">{dispersionDirection ?? "Center"}</td>
              <td className="py-2">—</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="flex gap-2">
        <Button onClick={onAddAnother}>Add another shot</Button>
        <Button onClick={onDone} variant="destructive">
          Finish session
        </Button>
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 animate-fade-in">
      <div className="w-full max-w-sm rounded-xl border bg-background p-4 animate-content-in">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={onCancel}>
            Keep working
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Discard
          </Button>
        </div>
      </div>
    </div>
  );
}
