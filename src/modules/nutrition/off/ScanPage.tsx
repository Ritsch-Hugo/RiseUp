import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Icon } from '../../../core/ui'
import { useFoods } from '../foods/foodQueries'
import { isBarcode, type OffFood } from '../rules/off'
import { OffProductPanel } from './OffProductPanel'
import { fetchOffProduct, useOffActions } from './offQueries'
import styles from './off.module.css'

const SCAN_INTERVAL_MS = 300
const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

type Detector = { detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]> }
type DetectorCtor = new (options?: { formats: string[] }) => Detector

/** API native si le navigateur l'a (Chrome Android), sinon ZXing en WebAssembly chargé à la demande. */
async function loadDetector(): Promise<DetectorCtor> {
  const native = (globalThis as { BarcodeDetector?: DetectorCtor }).BarcodeDetector
  if (native) return native
  const { BarcodeDetector } = await import('barcode-detector/ponyfill')
  return BarcodeDetector as unknown as DetectorCtor
}

type Phase =
  | { kind: 'scanning' }
  | { kind: 'looking'; code: string }
  | { kind: 'found'; food: OffFood }
  | { kind: 'notfound'; code: string }
  | { kind: 'error'; code: string }

/** Scanner de code-barres : produit local d'abord, sinon Open Food Facts. */
export function ScanPage() {
  const { search } = useLocation()
  const navigate = useNavigate()
  const { data: foods } = useFoods()
  const actions = useOffActions(search)
  const [phase, setPhase] = useState<Phase>({ kind: 'scanning' })
  const [manual, setManual] = useState(false)
  const [code, setCode] = useState('')
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [torchAvailable, setTorchAvailable] = useState(false)
  const [torchOn, setTorchOn] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const track = useRef<MediaStreamTrack | null>(null)

  const lookup = async (barcode: string) => {
    const local = foods?.find((f) => f.barcode === barcode)
    if (local) {
      navigate(`/nutrition/aliments/${local.id}${search}`, { replace: true })
      return
    }
    setPhase({ kind: 'looking', code: barcode })
    try {
      const food = await fetchOffProduct(barcode)
      setPhase(food ? { kind: 'found', food } : { kind: 'notfound', code: barcode })
    } catch {
      setPhase({ kind: 'error', code: barcode })
    }
  }
  const lookupRef = useRef(lookup)
  lookupRef.current = lookup

  const scanning = phase.kind === 'scanning' && !manual
  useEffect(() => {
    if (!scanning) return
    let stopped = false
    let timer: number | undefined
    let stream: MediaStream | undefined

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (stopped) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        const el = video.current!
        el.srcObject = stream
        await el.play()
        track.current = stream.getVideoTracks()[0] ?? null
        const caps = track.current?.getCapabilities?.() as { torch?: boolean } | undefined
        setTorchAvailable(!!caps?.torch)

        const Detector = await loadDetector()
        let detector: Detector
        try {
          detector = new Detector({ formats: FORMATS })
        } catch {
          detector = new Detector()
        }
        const tick = async () => {
          if (stopped) return
          try {
            const found = (await detector.detect(el)).find((c) => isBarcode(c.rawValue))
            if (found) {
              stopped = true
              void lookupRef.current(found.rawValue.trim())
              return
            }
          } catch {
            // image illisible : on réessaie au prochain passage
          }
          timer = window.setTimeout(tick, SCAN_INTERVAL_MS)
        }
        void tick()
      } catch {
        setCameraError(
          'Impossible d’utiliser la caméra. Autorise-la dans le navigateur, ou saisis le code.'
        )
        setManual(true)
      }
    }
    void start()

    return () => {
      stopped = true
      window.clearTimeout(timer)
      stream?.getTracks().forEach((t) => t.stop())
      track.current = null
      setTorchOn(false)
    }
  }, [scanning])

  const toggleTorch = async () => {
    const next = !torchOn
    try {
      await track.current?.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet],
      })
      setTorchOn(next)
    } catch {
      setTorchAvailable(false)
    }
  }

  const close = `/nutrition/aliments${search}`
  const retry = () => {
    setPhase({ kind: 'scanning' })
    setCode('')
  }

  return (
    <div className={styles.scan}>
      {scanning && <video ref={video} className={styles.video} playsInline muted />}

      <div className={styles.scanTop}>
        <Link to={close} className={styles.closeButton} aria-label="Fermer le scanner">
          <Icon name="plus" size={22} style={{ transform: 'rotate(45deg)' }} />
        </Link>
        <h1 className={styles.scanTitle}>Scanner un produit</h1>
      </div>

      {scanning && (
        <svg
          className={styles.frame}
          width="280"
          height="170"
          viewBox="0 0 280 170"
          role="img"
          aria-label="Cadre de visée du code-barres"
        >
          <path
            d="M2 40V14a12 12 0 0 1 12-12h26"
            fill="none"
            stroke="#4D8DFF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M240 2h26a12 12 0 0 1 12 12v26"
            fill="none"
            stroke="#4D8DFF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M278 130v26a12 12 0 0 1-12 12h-26"
            fill="none"
            stroke="#4D8DFF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M40 168H14A12 12 0 0 1 2 156v-26"
            fill="none"
            stroke="#4D8DFF"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <line
            x1="18"
            x2="262"
            y1="85"
            y2="85"
            stroke="#38D0FF"
            strokeWidth="2"
            strokeOpacity="0.9"
          />
        </svg>
      )}

      {phase.kind === 'scanning' && (
        <div className={styles.scanTools}>
          {scanning && torchAvailable && (
            <button
              type="button"
              className={styles.tool}
              aria-pressed={torchOn}
              onClick={toggleTorch}
            >
              Lampe
            </button>
          )}
          <button type="button" className={styles.tool} onClick={() => setManual((m) => !m)}>
            {manual ? 'Utiliser la caméra' : 'Saisir le code'}
          </button>
        </div>
      )}
      {cameraError && phase.kind === 'scanning' && (
        <p className={styles.cameraError}>{cameraError}</p>
      )}

      {phase.kind === 'scanning' && manual && (
        <form
          className={styles.sheet}
          onSubmit={(e) => {
            e.preventDefault()
            if (isBarcode(code)) void lookup(code.trim())
          }}
        >
          <label htmlFor="barcode" className={styles.sub}>
            Code-barres (8 à 14 chiffres)
          </label>
          <input
            id="barcode"
            className={styles.codeInput}
            inputMode="numeric"
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          />
          <button type="submit" className={styles.searchButton} disabled={!isBarcode(code)}>
            Chercher le produit
          </button>
        </form>
      )}

      {phase.kind === 'looking' && (
        <div className={styles.sheet}>
          <p className={styles.help}>Recherche du produit {phase.code}…</p>
        </div>
      )}

      {phase.kind === 'found' && (
        <div className={styles.sheet}>
          <span className={styles.foundBadge}>
            <Icon name="check" size={14} /> Produit trouvé
          </span>
          <OffProductPanel
            food={phase.food}
            saving={actions.saving}
            failed={actions.failed}
            onAdd={() => actions.add(phase.food)}
            onEdit={() => actions.edit(phase.food)}
          />
          <button type="button" className={styles.link} onClick={retry}>
            Scanner un autre produit
          </button>
        </div>
      )}

      {(phase.kind === 'notfound' || phase.kind === 'error') && (
        <div className={styles.sheet}>
          <h2 className={styles.name}>
            {phase.kind === 'notfound' ? 'Produit introuvable' : 'Open Food Facts ne répond pas'}
          </h2>
          <p className={styles.help}>
            {phase.kind === 'notfound'
              ? `Le code ${phase.code} n’est pas dans Open Food Facts. Tu peux créer l’aliment toi-même.`
              : `Impossible de vérifier le code ${phase.code} pour l’instant. Réessaie ou crée l’aliment toi-même.`}
          </p>
          <button
            type="button"
            className={styles.searchButton}
            onClick={() =>
              navigate(`/nutrition/aliments/nouveau${search}`, {
                state: { barcode: phase.code },
              })
            }
          >
            Créer l’aliment
          </button>
          <button type="button" className={styles.link} onClick={retry}>
            Scanner un autre produit
          </button>
        </div>
      )}
    </div>
  )
}
