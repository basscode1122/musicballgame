---
name: "android-3d-kubus"
title: "Android bollen-muziekmachine (Kotlin + OpenGL ES)"
type: "code"
language: "kotlin"
---

// ============================================================================
// ANDROID APP: BOLLEN-MUZIEKMACHINE (2D-physics, spawners, muren + synth)
// ----------------------------------------------------------------------------
// Project:   maak in Android Studio een nieuw project "Empty Views Activity",
//            taal Kotlin, package: com.example.rotatingcube, min SDK 21.
//            Kopieer daarna de bestanden uit dit canvas 1-op-1 over.
// Wereld:    2D-physics in het XY-vlak (z = 0): ballen vallen, botsen, rollen
//            en glijden. De camera kijkt onder een vaste hoek naar het
//            speelvlak (alleen in- en uitzoomen).
// Modi:      Play     : 1 vinger swipen = ballen duwen,
//                        knijpen = zoom (richt op de plek tussen
//                        je vingers, niet altijd op het midden),
//                        tik = selecteren,
//                        dubbeltik = persistente ballen opnieuw laten vallen
//            Spawner  : lang indrukken = spawner plaatsen op die plek,
//                        tik = selecteren (slepen breekt het plaatsen af)
//            Muur     : vinger neer en slepen = muur tekenen,
//                        tik zonder slepen = selecteren
// Spawners:  meerdere mogelijk; per spawner eigen interval (0,25-5 s),
//            eigen balgrootte (r 0,3-1,2) en eigen kleur, afvuurrichting
//            (pijl), afvuursnelheid (0-100, lineair 1:1, standaard 25),
//            gewicht (0-100 -> x0,1..x1,9: schaalt de zwaartekracht en de
//            weerstand tegen het wegduwen; zwaar = valt hard, laat zich
//            moeilijk duwen), volume (0-100%), velocity-diepte in dB
//            (0 t/m -24, standaard -8: volume bij kruipende bal; de
//            globale slider in Instellingen is het standaard voor NIEUWE
//            spawners) en golfvorm-preset (Sinus/Blok/Zaag/Driehoek/
//            Sample). De toonhoogte komt
//            van de plek op het canvas (zie Hoogte). Ritmisch grid:
//            elke spawn exact op het interval. Veld: afmetingen instelbaar
//            (Veldbreedte/Veldhoogte, totaal 100-600, standaard 200x200,
//            dus ~3x kleiner dan voorheen), uitzoomgrens dynamisch: heel
//            veld zichtbaar.
// Camera:    recht van boven, haaks op het speelveld (top-down, geen
//            zij-aanzicht): scherm-omhoog = +y in het veld (= hogere
//            toon). Alleen in- en
//            uitzoomen. Volledig uitgezoomd zie je het HELE speelveld
//            (de uitzoomgrens past zich aan het schermformaat aan).
//            Knijpen zoomt op de plek tussen je vingers; met 2 vingers
//            samen schuiven pant je de camera over het veld (zoals
//            Google Maps: het veld plakt aan je vingers; het vastgepakte
//            punt blijft tussen de vingers, ook als je ondertussen
//            knijpt). Mikpunt beweegbaar, geklemd binnen het HELE veld
//            (x en y +-veldbreedte/-hoogte). De
//            knop "Camera" bij Opslaan/Laden/Reset zet het mikpunt en de
//            afstand terug naar het begin. Het mikpunt en de veldafmetingen
//            gaan mee met
//            Opslaan/Laden (velden cam.dist/cam.tx/cam.ty en fw/fh; oude
//            opslag zonder fw/fh houdt de huidige afmeting; opslag
//            met draaihoeken laadt gewoon, die worden genegeerd).
// Muren:     lijnstukken met eigen "bounce" (restitutie 0,05-2,0; boven
//            1,0 versnelt de muur de bal). Kleur = bounce: rood = dood,
//            groen = bouncy, blauw = versneller. Tik in Muur-modus (zonder
//            slepen) selecteert de muur; Verwijder haalt hem weg.
//            Elke muurbotsing klinkt een octaaf lager (de toonhoogte zelf
//            volgt de hoogte van de bal, zie Hoogte).
// Ladder:    globaal te kiezen (slider "Ladder"): pentatonisch mineur,
//            pentatonisch majeur, majeur, mineur (aeolisch) of melodisch
//            mineur. Grondtoon instelbaar (slider "Grondtoon", A..G#);
//            standaard A (A1 = 55 Hz). De ladder verandert live: elke
//            botsing herberekent zijn noot op de actieve ladder.
// Hoogte:    de toonhoogte van een botsing volgt de ABSOLUTE plek op het
//            canvas: het midden = A4 (440 Hz, het midden van de piano) en
//            de hoogte van het HELE veld (instelbaar met "Veldhoogte",
//            standaard 200) = het ingestelde
//            aantal octaven (slider "Octaven", 2 t/m 6, standaard 4). De
//            doeltoon wordt op de dichtstbijzijnde ladder-trap
//            gekwantiseerd; geklemd op A1 onder en de ladder-top boven.
//            Spawners tactisch plaatsen is dus belangrijk: hoger op het
//            canvas = hogere toon. Zoomen verandert de toon NIET: de
//            schaal staat vast op de veldhoogte.
// Sample:    per spawner in de Sampler-modus: houd de opnameknop ingedrukt
//            om max 5 s microfoongeluid op te nemen (AudioRecord 48 kHz).
//            Elke bounce speelt de sample gepitched volgens de ladder
//            (playbackRate = noot / basistoon), geklemd 0,25-4x. De opname
//            wordt genormaliseerd (piek 0,95) en er is een sleepbaar
//            startpunt (0..1, zichtbaar in de waveform). Zonder sample valt
//            de spawner terug op de golfvorm. De sample gaat mee met
//            Opslaan/Laden (base64 Int16-PCM).
// Modus:     elke spawner is een Synth óf een Sampler. Synth: golfvorm
//            (sinus/blok/zaag/driehoek) + optionele FM met 4 modulators
//            (per modulator aan/uit, ratio 0,25..8 logaritmisch, index
//            0..4 lineair; deviatie = index × noot). Sampler: opname met
//            normalisatie, waveform-weergave en startpunt.
// Visueel:   ballen zijn PLATTE fellere schijven (geen 3D-look meer:
//            shading en rol-zichtbaarheid zijn eraan; sat 0,85 /
//            light 0,55, bots-flash naar de complementaire kleur).
//            Achter elke bal loopt een lichte, doorzichtige TRAIL die
//            duidelijker is bij hogere snelheid en taps toeloopt; de
//            sterkte/dikte staat globaal in Instellingen ("Trail"
//            0-100%, 0 = onzichtbaar, standaard 50%). Muren, pijlen en
//            achtergrond behouden wel de lichte 3D-shading.
// Synth:     ADR-envelope per spawner (attack/decay/release; de globale
//            sliders in Instellingen zijn het standaard voor nieuwe
//            spawners), velocity-diepte (0 t/m -24 dB), 8-voice pool,
//            AudioTrack 48 kHz low-latency met 2x CHUNK buffer-marge.
//            Frequenties exact op de ladder (geen random detune), dus
//            alles consonant. Soft clipping (tanh) op de mix tegen kraak.
//            Tegen gekraak zónder clipping (buffer-underruns door
//            audio-thread-CPU-pieken): de thread draait op
//            THREAD_PRIORITY_URGENT_AUDIO en de velocity-pow + vaste
//            niveaus staan per chunk vast in plaats van per sample.
// Stereo:    elke botsing klinkt in stereo met panning: de bal klinkt
//            links/rechts naar gelang de plek van de botsing op het
//            scherm, maximaal 75% (constant-power, dus geen hard panning).
//            Botsingen buiten beeld worden zachter naarmate je verder
//            ingezoomd bent: volledig uitgezoomd is alles even hard
//            (0 dB), volledig ingezoomd klinkt wat je niet ziet -8 dB,
//            vloeiend via een fade-zone van 15% langs de beeldrand.
// Opslag:    knoppen Opslaan/Laden/Reset: de wereld (spawners incl. ADR,
//            gewicht + velocity-diepte, muren, camera, synth, ladder +
//            grondtoon + octaven, trail-sterkte, stem-pool (aantal +
//            stel-modus), samples) als JSON in SharedPreferences (v5;
//            oudere opslag laadt met de standaardwaarden).
// Selectie:  aparte strip onderaan, altijd zichtbaar zolang er iets is
//            geselecteerd (spawner of muur) en helemaal weg bij geen
//            selectie: sliders (interval, grootte, richting, snelheid,
//            gewicht, volume, velocity-diepte), moduskeuze (Synth met
//            golf+FM of Sampler met opnameknop, waveform en startpunt),
//            muur-bounce-slider, en een verwijderknop.
// Threads:   overal het lockvrije @Volatile-patroon: de UI-thread schrijft
//            alleen @Volatile request-velden en camera-parameters, de
//            GL-thread consumeert ze; de audio-thread leest @Volatile
//            envelope-parameters 1x per buffer. De opname-thread levert
//            de sample af via @Volatile pendingSample.
// ============================================================================


// ============================================================================
// BESTAND: app/src/main/AndroidManifest.xml
// ============================================================================

<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- voor de sampler-modus: eigen microfoon-opnames per spawner -->
    <uses-permission android:name="android.permission.RECORD_AUDIO" />

    <application
        android:label="Ball Music Machine"
        android:theme="@android:style/Theme.Material.NoActionBar">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>


// ============================================================================
// BESTAND: app/src/main/java/com/example/rotatingcube/CollisionSynth.kt
// ============================================================================

package com.example.rotatingcube

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import android.os.Build
import android.os.Process
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.tan
import kotlin.math.tanh

/**
 * Microfoon-sample van een spawner (immutable: lockvrij deelbaar over threads).
 * baseFreq = de noot van de spawner op het moment van opnemen; de playback-
 * rate bij een botsing = botsingfrequentie / baseFreq (pentatonisch, net als
 * de synth-tonen).
 */
class SampleData(
    val data: FloatArray,
    val baseFreq: Float,
    val sampleRate: Int,
    /** startpunt van afspelen (0..1 van de opname); UI schrijft, audio leest */
    @Volatile var start: Float = 0f
)

/** Eén FM-modulator: en = actief, ratio = frequentieverhouding t.o.v. de
 *  noot (0.25..8), index = modulatiediepte (deviatie = index x noot). */
class FmMod(val en: Boolean, val ratio: Float, val index: Float)

/** FM-instellingen van een spawner als onveranderlijke momentopname
 *  (copy-on-write naar de audio-thread, net als de samples). */
class FmVoice(val on: Boolean, val mods: Array<FmMod>)

/**
 * Synthesizer die bij elke botsing een toon speelt.
 *
 * Envelope: ADR per spawner (attack / decay / release):
 *   ATTACK : lineaire ramp van (eventueel huidig niveau) naar de piek
 *   DECAY  : exponentiele val van de piek naar SUSTAIN (-12 dB)
 *   RELEASE: na de GATE (300 ms) exponentiele val naar 0
 * Elke botsing krijgt de ADR van zijn spawner mee; de @Volatile-parameters
 * hieronder zijn de GLOBALE STANDAARD (Instellingen) voor nieuwe spawners
 * en voor ballen zonder spawner. De audio-thread leest de per-voice
 * momentopname 1x per trigger in.
 *
 * Velocity: de impactsnelheid wordt genormaliseerd naar 0..1. De
 * velocity-diepte (0 t/m -24 dB) bepaalt hoeveel zachtere slagen zijn:
 *   volume = piek * 10^(diepte * (1 - vel) / 20)
 * De diepte staat PER SPAWNER (standaard -8 dB bij de laagste snelheid,
 * 0 dB bij de hoogste; de globale slider in Instellingen is de standaard
 * voor nieuwe spawners, afgerond op hele dB's).
 *
 * Toonhoogte: per botsing meegegeven (playCollision(impact, freq, pitchMul, wave, vol, spId, sampler, ..., pan, gainMul)).
 * De frequentie volgt de ABSOLUTE hoogte van de bal op het canvas (midden
 * = A4); muur-hits krijgen pitchMul 0,5 (een octaaf lager). De frequentie
 * wordt exact overgenomen (geen random detune) en ligt op de ladder,
 * zodat alles consonant blijft.
 * Spawner-modus: elke spawner is een SYNTH (oscillator) of een SAMPLER
 * (eigen microfoon-opname, gepitcht op de ladder, gestart vanaf het
 * ingestelde startpunt; de opname is genormaliseerd op piek 0,95).
 * Zonder opname valt de sampler terug op de synth.
 * Wave (per spawner, overgenomen door ballen): 0=Sinus, 1=Blok, 2=Zaag,
 * 3=Driehoek; elke golf krijgt de 2e harmonische als extra gloed.
 * FM (optioneel, alleen in synth-modus): tot 4 sinus-modulators per
 * spawner, frequentie = ratio x de noot, deviatie = index x de noot.
 * Volume (per spawner, overgenomen door ballen): schaalt de piek van de stem.
 *
 * Stereo + panning: de output is stereo (interleaved L/R). Elke stem
 * krijgt een pan-waarde (-0,75..0,75, constant-power: L = cos, R = sin)
 * mee naar gelang de plek van de botsing op het scherm, dus nooit hard
 * links/rechts. gainMul dempt stemmen die buiten beeld botsen: de
 * renderer berekent per botsing een factor (1,0 = vol, tot -8 dB bij
 * volledig ingezoomd; volledig uitgezoomd is alles 1,0).
 *
 * Tegen kraak (clipping): de som van de stemmen (max 64) kan boven 1.0
 * uitkomen; per stem schaalt het niveau mee met sqrt(8/maxVoices) en
 * het eindmix krijgt soft clipping (tanh) in plaats van een harde muur.
 *
 * Verder: voice-pool (instelbaar: 8 t/m 64 stemmen, standaard 8),
 * streaming AudioTrack (48 kHz, stereo, 16-bit),
 * USAGE_GAME + low-latency, rate-limit van 25 ms, fase-accumulatie per
 * voice (geen klik bij hertoewijzen) en anti-click attack. Is de pool
 * vol, dan wordt er een stem gestolen: de oudste (standaard) of degene
 * het verst van het cameramikpunt (midden van het scherm); per stem
 * schaalt het niveau met sqrt(8/max) mee zodat de som nooit clippt.
 *
 * Tegen gekraak zónder clipping (buffer-underruns): de render-thread
 * draait op THREAD_PRIORITY_URGENT_AUDIO, de AudioTrack-buffer heeft 2x
 * CHUNK marge, en wat binnen een chunk toch niet verandert (de velocity-
 * pow, het vaste basisniveau) staat per chunk vast in plaats van per
 * sample. Geen allocaties in de render-loop.
 */
class CollisionSynth {

    companion object {
        private const val SAMPLE_RATE = 48000
        private const val VOICE_POOL = 64     // vaste pool; actieve limiet = maxVoices
        private const val CHUNK = 1024
        private const val MIN_TONE_INTERVAL_NS = 25_000_000L
        private const val MASTER = 0.28
        private const val BASE_LEVEL = 0.85      // piekniveau bij vel = 1
        private const val SUSTAIN = 0.25         // -12 dB, na de decay
        private const val GATE_SEC = 0.30        // nootlengte voor de release
        private const val ENV_FLOOR = 0.0006
        private const val PHASE_IDLE = 0
        private const val PHASE_ATTACK = 1
        private const val PHASE_DECAY = 2
        private const val PHASE_RELEASE = 3
    }

    // ---- envelope-standaarden (UI-thread schrijft, audio-thread leest) ----
    @Volatile var attackSec = 0.002
    @Volatile var decaySec = 0.15
    @Volatile var releaseSec = 0.25
    // globale STANDAARD velocity-diepte voor nieuwe spawners (de slider in
    // Instellingen rondt af op hele dB's; 33/100 -> exact -8 dB)
    @Volatile var velocityDepthDb = -8.0

    // stem-pool: maximaal aantal gelijktijdige stemmen (8..64, standaard 8)
    // + welke stem er gestolen wordt als de pool vol zit: de oudste
    // (standaard) of degene het verst van het cameramikpunt
    @Volatile var maxVoices = 8
    @Volatile var stealFurthest = false

    private class Voice {
        @Volatile var trigger = 0
        @Volatile var frequency = 0.0
        @Volatile var velNorm = 0.0
        @Volatile var velDb = -8.0              // velocity-diepte van de spawner
        @Volatile var wave = 0
        @Volatile var vol = 1.0
        @Volatile var sample: SampleData? = null
        @Volatile var rate = 1.0
        @Volatile var sampler = false          // spawner-modus: sampler actief
        @Volatile var fm: FmVoice? = null      // FM-instellingen (synth-modus)
        // botsplek (wereld-eenheden) + trigger-tijd: nodig om te bepalen
        // welke stem er gestolen wordt (oudste of verste t.o.v. de camera)
        @Volatile var x = 0f
        @Volatile var y = 0f
        @Volatile var trigNs = 0L
        // stereo-panning (-0,75..0,75) en buiten-beeld-demping (1 = vol)
        @Volatile var pan = 0f
        @Volatile var gainMul = 1f
        // ADR van de spawner (of de globale standaard) op het moment van de botsing
        @Volatile var envAtk = 0.002
        @Volatile var envDcy = 0.15
        @Volatile var envRel = 0.25
        // ---- audio-thread state ----
        var seenTrigger = 0
        var phase = PHASE_IDLE
        var phaseT = 0.0
        var gateT = 0.0
        var env = 0.0
        var attackFrom = 0.0
        var releaseFrom = 0.0
        var freqNow = 0.0
        var velNow = 0.0
        var velDbNow = -8.0
        var waveNow = 0
        var volNow = 1.0
        var sampleNow: SampleData? = null
        var rateNow = 1.0
        var samplerNow = false
        var fmNow: FmVoice? = null
        var gainMulNow = 1f
        // per chunk vaste vermenigvuldigers: de pow van de velocity-diepte
        // hoort NIET in de per-sample-loop (8 stemmen x 1024 samples is
        // ~8000 pow-aanroepen per chunk = audio-thread-CPU = underrun-gevaar)
        var velGainNow = 1.0
        var lvlBaseNow = 0.0
        // constant-power pan-factoren (L = cos, R = sin); veranderen alleen
        // bij een trigger, dus vooraf berekend in plaats van per sample
        var panL = Math.cos(Math.PI / 4.0)
        var panR = Math.sin(Math.PI / 4.0)
        var atkNow = 0.002
        var dcyNow = 0.15
        var relNow = 0.25
        val modPhase = DoubleArray(4)           // FM-modulator-fases
        var smpPos = 0.0
        var phaseAccum = 0.0
        var active = false
    }

    private val voices = Array(VOICE_POOL) { Voice() }
    private var lastToneNs = 0L

    /** stem-slot kiezen: eerst een vrije stem binnen de limiet, anders
     *  stelen: de oudste stem (standaard) of degene het verst van het
     *  cameramikpunt (midden van het scherm). Lockvrij lezen van
     *  v.active/trigNs is veilig: het ergste dat kan is een suboptimale
     *  keuze, nooit een race op de audio-thread. */
    private fun pickVoice(now: Long, x: Float, y: Float, camX: Float, camY: Float): Voice {
        val cap = maxVoices.coerceIn(1, VOICE_POOL)
        for (i in 0 until cap) if (!voices[i].active) return voices[i]
        var victim = voices[0]
        if (stealFurthest) {
            var bestD = -1.0
            for (i in 0 until cap) {
                val v = voices[i]
                val d = Math.hypot((v.x - camX).toDouble(), (v.y - camY).toDouble())
                if (d > bestD) { victim = v; bestD = d }
            }
        } else {
            for (i in 0 until cap) if (voices[i].trigNs < victim.trigNs) victim = voices[i]
        }
        return victim
    }

    // samples per spawner-id; copy-on-write zodat de audio-thread er
    // lockvrij in kan lezen en de schrijver (GL-thread) veilig kan updaten
    @Volatile private var samples: Map<Int, SampleData> = emptyMap()

    // FM-instellingen per spawner-id, zelfde copy-on-write-patroon
    @Volatile private var fmVoices: Map<Int, FmVoice> = emptyMap()

    /** sample van een spawner zetten of wissen (speler-id -> data) */
    fun setSample(spId: Int, smp: SampleData?) {
        val m = HashMap(samples)
        if (smp == null) m.remove(spId) else m[spId] = smp
        samples = m
    }

    /** FM-instellingen van een spawner zetten of wissen (momentopname) */
    fun setFm(spId: Int, fm: FmVoice?) {
        val m = HashMap(fmVoices)
        if (fm == null) m.remove(spId) else m[spId] = fm
        fmVoices = m
    }

    private var track: AudioTrack? = null
    @Volatile private var running = false
    private var thread: Thread? = null

    /**
     * Door de GL-thread aangeroepen bij een botsing.
     * impactSpeed in wereld-eenheden/s, freq = hoogte-toon van de bal,
     * pitchMul = 0,5 voor muur-hits (octaaf lager),
     * wave = 0..3 (Sinus / Blok / Zaag / Driehoek), vol = 0..1
     * per spawner, spId = spawner van de bal,
     * sampler = true als de spawner in sampler-modus zit (zonder opname
     * valt de stem terug op de synth met de ingestelde golfvorm).
     * velDb = velocity-diepte van de SPAWNER in dB (0 t/m -24; de globale
     * Instellingen-waarde is alleen de standaard voor nieuwe spawners).
     * FM-instellingen worden via setFm per spawner meegegeven.
     * pan = -0,75..0,75 (constant-power stereo, geen hard panning),
     * gainMul = buiten-beeld-demping van de renderer (1 = vol).
     * Frequentie exact (geen detune), voor consonante klank.
     */
    fun playCollision(impactSpeed: Float, freq: Float, pitchMul: Float, wave: Int, vol: Float, spId: Int, sampler: Boolean, atk: Double, dcy: Double, rel: Double, velDb: Double, pan: Float, gainMul: Float, x: Float, y: Float, camX: Float, camY: Float) {
        val now = System.nanoTime()
        if (now - lastToneNs < MIN_TONE_INTERVAL_NS) return
        lastToneNs = now

        val voice = pickVoice(now, x, y, camX, camY)
        voice.x = x
        voice.y = y
        voice.trigNs = now

        voice.frequency = freq.toDouble() * pitchMul
        voice.velNorm = (impactSpeed / 10.0).coerceIn(0.0, 1.0)
        voice.velDb = velDb.coerceIn(-24.0, 0.0)
        voice.wave = wave
        voice.vol = vol.toDouble().coerceIn(0.0, 1.0)
        voice.envAtk = atk
        voice.envDcy = dcy
        voice.envRel = rel
        val smp = samples[spId]
        voice.sample = smp
        voice.sampler = sampler && smp != null
        voice.rate = if (smp != null)
            (freq.toDouble() * pitchMul / smp.baseFreq).coerceIn(0.25, 4.0) else 1.0
        voice.fm = fmVoices[spId]
        voice.pan = pan.coerceIn(-0.75f, 0.75f)
        voice.gainMul = gainMul.coerceIn(0f, 1f)
        voice.trigger++   // pas laatste: dan zijn frequency en velNorm zichtbaar
    }

    fun start() {
        if (running) return
        running = true

        val minBuf = AudioTrack.getMinBufferSize(
            SAMPLE_RATE, AudioFormat.CHANNEL_OUT_STEREO, AudioFormat.ENCODING_PCM_16BIT
        )
        val builder = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_GAME)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
                    .build()
            )
            .setBufferSizeInBytes(maxOf(minBuf, CHUNK * 8))   // 2x CHUNK frames stereo 16-bit: marge tegen underruns
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder.setPerformanceMode(AudioTrack.PERFORMANCE_MODE_LOW_LATENCY)
        }
        track = builder.build()
        track?.play()

        thread = Thread({ renderLoop() }, "ball-synth").apply {
            // prioriteit staat in renderLoop zelf:
            // Process.setThreadPriority(THREAD_PRIORITY_URGENT_AUDIO)
            start()
        }
    }

    fun stop() {
        running = false
        thread?.let { t ->
            try { t.join(500) } catch (_: InterruptedException) { }
        }
        thread = null
    }

    private fun renderLoop() {
        // echte audio-thread-prioriteit: de scheduler behandelt deze thread
        // als tijd-kritisch, wat buffer-underruns (gekraak) tegengaat
        Process.setThreadPriority(Process.THREAD_PRIORITY_URGENT_AUDIO)
        val buffer = ShortArray(CHUNK * 2)     // interleaved stereo L/R
        val dt = 1.0 / SAMPLE_RATE
        val twoPi = 2.0 * Math.PI
        val audioTrack = track

        while (running && audioTrack != null) {

            // 1. nieuwe triggers oppikken (lockvrij via @Volatile)
            for (v in voices) {
                if (v.seenTrigger != v.trigger) {
                    v.seenTrigger = v.trigger
                    v.freqNow = v.frequency
                    v.velNow = v.velNorm
                    v.velDbNow = v.velDb
                    v.waveNow = v.wave
                    v.volNow = v.vol
                    v.sampleNow = v.sample
                    v.rateNow = v.rate
                    v.samplerNow = v.sampler
                    v.fmNow = v.fm
                    v.gainMulNow = v.gainMul
                    val th = (v.pan + 1f) * Math.PI / 4.0
                    v.panL = cos(th)
                    v.panR = sin(th)
                    // ADR-momentopname van de spawner (of de globale standaard)
                    v.atkNow = v.envAtk
                    v.dcyNow = v.envDcy.coerceAtLeast(0.001)
                    v.relNow = v.envRel
                    // sample-playback start op het ingestelde startpunt
                    val s0 = v.sampleNow
                    v.smpPos = if (s0 != null)
                        s0.start * s0.data.size / s0.sampleRate.toDouble() else 0.0
                    v.modPhase.fill(0.0)
                    v.attackFrom = if (v.active) v.env else 0.0
                    v.env = v.attackFrom
                    v.active = true
                    v.phase = PHASE_ATTACK
                    v.phaseT = 0.0
                    v.gateT = 0.0
                }
            }
            // per stem per chunk vastzetten wat binnen een chunk toch niet
            // verandert: de velocity-pow (met de diepte VAN DEZE SPINNER,
            // niet meer de globale waarde) en het vaste basisniveau. Scheelt
            // tot ~8000 pow-aanroepen per chunk aan CPU-marge op de
            // audio-thread (buffer-underruns = gekraak zónder clipping).
            // Het niveau per stem schaalt mee met sqrt(8/maxVoices): bij een
            // grotere pool blijft de som (en dus de headroom) gelijk aan
            // de 8-stemmen-situatie, dus géén clipping/gekraak bij 64 stemmen
            val masterMul = MASTER * Math.sqrt(8.0 / maxVoices.coerceIn(1, VOICE_POOL))
            for (v in voices) {
                if (!v.active) continue
                v.velGainNow = pow(10.0, v.velDbNow * (1.0 - v.velNow) / 20.0)
                v.lvlBaseNow = BASE_LEVEL * v.velGainNow * v.volNow * v.gainMulNow * masterMul
            }
            // 2. alle stemmen mixen (stereo, interleaved L/R)
            for (i in 0 until CHUNK) {
                var sampleL = 0.0
                var sampleR = 0.0
                for (v in voices) {
                    if (!v.active) continue

                    when (v.phase) {
                        PHASE_ATTACK -> {
                            v.phaseT += dt
                            if (v.atkNow <= 0.0 || v.phaseT >= v.atkNow) {
                                v.env = 1.0
                                v.phase = PHASE_DECAY
                                v.phaseT = 0.0
                            } else {
                                val frac = v.phaseT / v.atkNow
                                v.env = v.attackFrom + (1.0 - v.attackFrom) * frac
                            }
                        }
                        PHASE_DECAY -> {
                            v.phaseT += dt
                            v.gateT += dt
                            v.env = SUSTAIN + (1.0 - SUSTAIN) * exp(-v.phaseT / v.dcyNow)
                            if (v.gateT >= GATE_SEC) {
                                v.phase = PHASE_RELEASE
                                v.phaseT = 0.0
                                v.releaseFrom = v.env
                            }
                        }
                        PHASE_RELEASE -> {
                            v.phaseT += dt
                            v.env = if (v.relNow > 0.0) v.releaseFrom * exp(-v.phaseT / v.relNow) else 0.0
                            if (v.env < ENV_FLOOR) {
                                v.env = 0.0
                                v.active = false
                                v.phase = PHASE_IDLE
                            }
                        }
                    }

                    // velocity -> volume (0 t/m -24 dB diepte): de pow staat
                    // per chunk vast (velGainNow), niet per sample

                    // golfvorm: sampler-modus met opname -> sample-playback
                    // vanaf het startpunt, anders oscillator (zonder opname
                    // valt de sampler terug op de ingestelde golfvorm)
                    val smp = v.sampleNow
                    val level: Double
                    if (v.samplerNow && smp != null) {
                        v.smpPos += v.rateNow * dt          // pos in seconden
                        val idx = (v.smpPos * smp.sampleRate).toInt()
                        if (idx >= smp.data.size) {
                            v.env = 0.0                     // sample afgelopen: stem uit
                            v.active = false
                            v.phase = PHASE_IDLE
                            level = 0.0
                        } else {
                            level = smp.data[idx].toDouble()
                        }
                    } else {
                        // FM: sinus-modulators op ratio x de noot; de index
                        // geeft de deviatie (index x noot) als frequentie-modulatie
                        val fm = v.fmNow
                        var modSum = 0.0
                        if (fm != null && fm.on) {
                            for (k in fm.mods.indices) {
                                val md = fm.mods[k]
                                if (!md.en || k >= v.modPhase.size) continue
                                v.modPhase[k] += twoPi * v.freqNow * md.ratio * dt
                                modSum += md.index * v.freqNow * sin(v.modPhase[k])
                            }
                        }
                        // oscillator: fase loopt door, geen klik; wave per stem
                        v.phaseAccum += twoPi * (v.freqNow + modSum) * dt
                        val ph = v.phaseAccum
                        val p = (((ph % twoPi) + twoPi) % twoPi) / twoPi   // 0..1
                        val osc = when (v.waveNow) {
                            1 -> if (p < 0.5) 1.0 else -1.0                // blok
                            2 -> 2.0 * p - 1.0                             // zaag
                            3 -> 4.0 * abs(p - 0.5) - 1.0                  // driehoek
                            else -> sin(ph)                                // sinus (incl. Sample-zonder-opname)
                        }
                        // 2e harmonische als extra gloed (minder bij scherpe golven)
                        val harm = if (v.waveNow == 1 || v.waveNow == 2) 0.15 else 0.3
                        level = osc + harm * sin(2.0 * ph)
                    }
                    // panning + buiten-beeld-demping: L = cos, R = sin
                    // (constant-power, pan 0 = beide 0,707 = -3 dB)
                    val lvl = v.lvlBaseNow * v.env * level
                    sampleL += lvl * v.panL
                    sampleR += lvl * v.panR
                }
                // soft clipping (tanh): geen harde muur, dus geen kraak bij
                // hoge stem-aantallen; tanh(x) blijft vanzelf binnen -1..1
                buffer[i * 2] = (tanh(sampleL) * 32767.0).toInt().toShort()
                buffer[i * 2 + 1] = (tanh(sampleR) * 32767.0).toInt().toShort()
            }
            // 3. naar de speaker
            audioTrack.write(buffer, 0, CHUNK * 2)
        }

        audioTrack?.stop()
        audioTrack?.release()
        track = null
    }
}


// ============================================================================
// BESTAND: app/src/main/java/com/example/rotatingcube/BallSurfaceView.kt
// ============================================================================

package com.example.rotatingcube

import android.content.Context
import android.opengl.GLSurfaceView
import android.view.MotionEvent

/**
 * De OpenGL-oppervlakview. Alle gebaren (swipe, pinch, lang indrukken,
 * muur tekenen) worden afgehandeld door de renderer; deze view stuurt de
 * touch-events alleen door.
 */
class BallSurfaceView(context: Context, private val renderer: BallRenderer) :
    GLSurfaceView(context) {

    init {
        setEGLContextClientVersion(2)
        preserveEGLContextOnPause = true
        setRenderer(renderer)
        renderMode = RENDERMODE_CONTINUOUSLY
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        renderer.handleTouch(event)
        return true
    }
}


// ============================================================================
// BESTAND: app/src/main/java/com/example/rotatingcube/BallRenderer.kt
// ============================================================================

package com.example.rotatingcube

import android.opengl.GLES20.*
import android.opengl.GLSurfaceView
import android.os.Handler
import android.os.Looper
import android.util.Base64
import android.view.MotionEvent
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.ShortBuffer
import javax.microedition.khronos.egl.EGLConfig
import javax.microedition.khronos.opengles.GL10
import org.json.JSONArray
import org.json.JSONObject
import kotlin.math.*

/**
 * Renderer + physics + gebarenlogica van de bollen-muziekmachine.
 *
 * De wereld is 2D in het XY-vlak (z = 0): ballen vallen onder zwaartekracht,
 * botsen onderling (massa ~ r^2) en op muren (lijnstukken met eigen
 * restitutie). Ballen die op een muur landen glijden en rollen verder
 * (wrijving + rollende rotatie); zware slagen stuiteren.
 */
class BallRenderer : GLSurfaceView.Renderer {

    companion object {
        // ---- wereld-constanten ----
        private const val BALL_MAX = 60
        private const val GRAVITY = 10f
        private const val AIR_DRAG = 0.05f
        private const val MAX_SPEED = 100f        // = max afvuursnelheid (was 20)
        private const val WALL_HALF = 0.15f          // halve muurdikte
        private const val WALL_DEPTH = 0.28f        // muurdiepte in z
        private const val CONTACT_FRICTION = 2f      // wrijving tijdens contact
        private const val REST_SPEED = 0.6f         // onder deze snelheid: geen bounce
        private const val MIN_TONE_SPEED = 0.8f
        private const val MIN_FLASH_SPEED = 0.1f
        private const val FLASH_DECAY = 4f
        // ballen verdwijnen pas als ze VOLLEDIG buiten de speelruimte zijn
        // (rand van de bal voorbij de grens, niet het middelpunt);
        // de grenzen zijn de instelbare veldafmetingen (fieldHalfX/Y)
        private const val SWIPE_GAIN = 6f
        private const val SWIPE_RADIUS = 2.5f
        // afvuursnelheid zit per spawner in sp.speed (0..100, standaard 25)
        private const val CAM_MIN_DIST = 5f   // maximale inzoom (uitzoomgrens: maxCamDist())
        // veldafmetingen: halve breedte/hoogte klempen op 50..300
        // (totaal 100..600; standaard 100 = veld 200x200)
        private const val FIELD_HALF_MIN = 50f
        private const val FIELD_HALF_MAX = 300f
        private const val SECTORS = 24
        // platte schijf i.p.v. 3D-bol: middelpunt + rand, driehoek-fan
        // trail: lichte doorzichtige sleep achter de ballen
        private const val TRAIL_PTS = 12          // historiepunten per bal
        private const val TRAIL_MAX_ALPHA = 0.55f // blijft "licht doorzichtig"
        private const val CENTER_X = 0f
        private const val CENTER_Y = 1.2f
        private const val CENTER_Z = 0f
        // de camera staat recht boven het speelveld en kijkt haaks omlaag
        // (top-down, geen zij-aanzicht): scherm-omhoog = +y in het veld
        private const val CAM_DX = 0f
        private const val CAM_DY = 0f
        private const val CAM_DZ = 1f
        // absolute toonhoogte: het midden van het veld = A4 = midden piano
        private const val MID_F = 440f
        // buiten-beeld-demping: volledig ingezoomd = -8 dB (uitgezoomd = 0)
        private const val OFFSCREEN_DB = 8f

        // ---- modi ----
        const val MODE_PLAY = 0
        const val MODE_SPAWNER = 1
        const val MODE_WALL = 2

        // ---- selectie ----
        const val SEL_NONE = 0
        const val SEL_SPAWNER = 1
        const val SEL_WALL = 2

        // ---- toonladders (globaal): 5 standaard ladders; grondtoon via rootSemi ----
        val SCALE_NAMES = arrayOf(
            "Pentatonic minor", "Pentatonic major", "Major",
            "Minor (Aeolian)", "Melodic minor"
        )
        val SCALE_SEMIS = arrayOf(
            intArrayOf(0, 3, 5, 7, 10),        // pentatonisch mineur (A C D E G)
            intArrayOf(0, 2, 4, 7, 9),         // pentatonisch majeur
            intArrayOf(0, 2, 4, 5, 7, 9, 11), // majeur
            intArrayOf(0, 2, 3, 5, 7, 8, 10),// mineur (aeolisch)
            intArrayOf(0, 2, 3, 5, 7, 9, 11) // melodisch mineur
        )
        // ---- spawner-modus: synth (oscillator + optionele FM) of sampler ----
        const val MODE_SYNTH = 0
        const val MODE_SAMPLER = 1
        /** globale ladder-keuze (UI vraagt via requestScale, GL-thread past toe) */
        @Volatile var scaleIdx = 0
        /** grondtoon: 0 = A, 1 = A#, ..., 11 = G# (UI vraagt via requestRoot) */
        @Volatile var rootSemi = 0
        /** hoogte-op-Canvas: octaven over de hoogte van het HELE veld (2..6) */
        @Volatile var octaves = 4
        /** veldafmetingen (instelbaar in Instellingen): halve breedte/hoogte.
         *  Maatstaf voor de toonschaal, de despawn-grenzen, de maximale
         *  uitzoom en het achtergrondvlak. UI schrijft, GL leest. */
        @Volatile var fieldHalfX = 100f
        @Volatile var fieldHalfY = 100f

        fun scaleLen(idx: Int) = SCALE_SEMIS[idx].size
        fun ladderMax(idx: Int) = SCALE_SEMIS[idx].size * 6 - 1   // 6 octaven boven de grondtoon
        fun ladderFreq(i: Int, idx: Int, root: Int = rootSemi): Float {
            val semi = SCALE_SEMIS[idx]
            val o = i / semi.size
            val k = i % semi.size
            return (55.0 * Math.pow(2.0, (root + o * 12 + semi[k]) / 12.0)).toFloat()
        }
        /** dichtstbijzijnde ladder-index op of onder de frequentie */
        fun ladderIndexBelow(f: Float, idx: Int, root: Int = rootSemi): Int {
            // +1e-3 tegen afronding van de noten (afgeronde constanten kwamen
            // soms 1 index te laag uit, bv. 293.66 -> 28.9997 in plaats van 29)
            val semi = SCALE_SEMIS[idx]
            val s = maxOf(0, Math.floor(12.0 * log2(f / 55f) + 1e-3).toInt() - root)
            val o = s / 12
            var k = 0
            for (j in semi.indices) if (semi[j] <= s % 12) k = j
            return minOf(ladderMax(idx), o * semi.size + k)
        }
        /** dichtstbijzijnde ladder-noot op of onder de frequentie */
        private fun ladderNearest(f: Float, idx: Int): Float {
            val i = ladderIndexBelow(f, idx)
            if (i >= ladderMax(idx)) return ladderFreq(ladderMax(idx), idx)
            val f0 = ladderFreq(i, idx)
            val f1 = ladderFreq(i + 1, idx)
            return if (f / f0 < f1 / f) f0 else f1      // log-helft
        }
        private val CUBE_FACE_NORMALS = arrayOf(
            floatArrayOf(0f, 0f, 1f), floatArrayOf(0f, 0f, -1f), floatArrayOf(0f, 1f, 0f),
            floatArrayOf(0f, -1f, 0f), floatArrayOf(1f, 0f, 0f), floatArrayOf(-1f, 0f, 0f)
        )
        private val CUBE_FACE_LIGHT = floatArrayOf(1.00f, 0.80f, 1.10f, 0.70f, 0.92f, 0.86f)
    }

    // ================================================================ data
    private class Ball {
        var x = 0f; var y = 0f; var vx = 0f; var vy = 0f; var r = 0.7f
        var angle = 0f; var spin = 0f; var flash = 0f
        var hue = 0f; var note = 440f; var wave = 0; var vol = 1f
        var spId = 0                              // spawner van de bal (voor Sample)
        var active = false; var spawned = false
        var bornNs = 0L
        var colorBuf = 0
        var wMul = 1f                             // gewicht: schaalt zwaartekracht en duw-weerstand
        // trail-historie: laatste TRAIL_PTS posities (ring buffer per bal)
        val trailX = FloatArray(TRAIL_PTS)
        val trailY = FloatArray(TRAIL_PTS)
        var trailLen = 0
    }

    private class Wall(val id: Int) {
        var x0 = 0f; var y0 = 0f; var x1 = 0f; var y1 = 0f
        var rest = 0.5f                          // "bounce" van de muur
        var colorBuf = 0
        var dirtyColor = true
    }

    private class Spawner(val id: Int) {
        var x = 0f; var y = 0f
        var interval = 1.5f                      // seconden tussen ballen
        var size = 0.7f                           // straal van de gespawnde bal
        var timer = 0f
        var angle = 270f                          // afvuurrichting in graden (270 = omlaag)
        var speed = 25f                           // afvuursnelheid (0..100, 1:1 met de slider)
        var weight = 50                           // gewicht 0..100 -> zwaartekracht/duw-factor x0,1..x1,9
        var velDb = -8.0                          // velocity-diepte van deze spawner (0..-24 dB)
        var wave = 0                              // waveform-preset (0=sinus 1=blok 2=zaag 3=driehoek)
        var vol = 1f                              // volume van de ballen (0..1)
        /** spawner-modus: synth (0, oscillator + FM) of sampler (1, opname) */
        @Volatile var mode = MODE_SYNTH
        /** FM (alleen synth-modus): aan/uit + 4 modulators
         *  (ratio 0.25..8, index 0..4 = modulatiediepte) */
        var fmOn = false
        val fmEn = booleanArrayOf(true, false, false, false)
        val fmRatio = floatArrayOf(1f, 2f, 3f, 0.5f)
        val fmIdx = floatArrayOf(1f, 0.5f, 0.5f, 1f)
        /** eigen microfoon-sample (sampler-modus); @Volatile: UI leest de lengte */
        @Volatile var sample: SampleData? = null
        /** ADR-envelope per spawner (begint op de globale standaard-instellingen) */
        var atk = 0.002
        var dcy = 0.15
        var rel = 0.25
        val hue = (id * 137.5f) % 360f            // gouden hoek: verdeelde kleuren
        /** toon = absolute plek op het canvas (wordt bij plaatsing berekend;
         *  basis voor de sampler-opname, zie addSpawner) */
        var note = 440f
        var colorBuf = 0
        var arrowBuf = 0
    }

    private val balls = Array(BALL_MAX) { Ball() }
    private val walls = ArrayList<Wall>()
    private val spawners = ArrayList<Spawner>()
    private var wallSeq = 0
    private var spawnerSeq = 0

    val synth = CollisionSynth()

    // ================================================== configuratie (UI -> GL)
    @Volatile var mode = MODE_PLAY
    @Volatile var persistentCount = 10
    @Volatile var requestReset = false

    /** Absolute hoogte op het canvas = toonhoogte: het midden van het veld
     *  is A4 (440 Hz, het midden van de piano) en de hoogte van het HELE
     *  veld (instelbaar met Veldhoogte, standaard 200) = `octaves`
     *  octaven. Gekwantiseerd
     *  op de dichtstbijzijnde ladder-trap; geklemd op A1 onder en de
     *  ladder-top boven. Zoomen verandert de toon NIET: de schaal staat
     *  vast op de veldhoogte. Hoger geplaatste spawners klinken dus
     *  hoger: tactisch plaatsen. */
    private fun posPitch(y: Float): Float {
        val shift = (y - CENTER_Y) / (2f * fieldHalfY) * octaves
        return ladderNearest(maxOf(ladderFreq(0, scaleIdx), (MID_F * Math.pow(2.0, shift.toDouble())).toFloat()), scaleIdx)
    }

    /** Genormaliseerde schermpositie (NDC) van een punt op het speelvlak:
     *  [x, y] met -1..1 = binnen beeld; null = (nog) geen camera of achter
     *  de camera. GL-thread: gebruikt de camera-assen van de laatste frame. */
    private fun ndcOf(x: Float, y: Float): FloatArray? {
        if (!cameraReady || surfaceW <= 0 || surfaceH <= 0) return null
        val vx = x - eyeX
        val vy = y - eyeY
        val vz = -eyeZ
        val w = -(vx * axZ[0] + vy * axZ[1] + vz * axZ[2])   // kijkdiepte
        if (w <= 0.1f) return null
        val aspect = surfaceW.toFloat() / surfaceH.toFloat()
        val tanH = tan(Math.toRadians(25.0)).toFloat()
        val cx = vx * axX[0] + vy * axX[1] + vz * axX[2]
        val cy = vx * axY[0] + vy * axY[1] + vz * axY[2]
        return floatArrayOf(cx / (w * tanH * aspect), cy / (w * tanH))
    }

    /** Buiten-beeld-demping: hoe verder je inzoomt, hoe zachter botsingen
     *  klinken die je niet meer ziet (volledig uitgezoomd = 0 dB verschil,
     *  volledig ingezoomd = -8 dB). Schaalt logaritmisch mee met de zoom
     *  en vloeiend over de beeldrand (15% NDC fade-zone). */
    private fun offscreenAtten(x: Float, y: Float): Float {
        if (!cameraReady) return 1f
        val nd = ndcOf(x, y)
        val out = if (nd == null) Float.MAX_VALUE else maxOf(abs(nd[0]), abs(nd[1]))
        val edge = ((out - 1f) / 0.15f).coerceIn(0f, 1f)      // 0 in beeld, 1 buiten
        val md = maxCamDist()   // dynamisch: heel veld zichtbaar = maximale uitzoom
        val zoomFrac = (ln(md / camDistance) / ln(md / CAM_MIN_DIST)).toFloat().coerceIn(0f, 1f)
        val db = -OFFSCREEN_DB * edge * zoomFrac
        return Math.pow(10.0, db / 20.0).toFloat()
    }

    // ---- wereld opslaan / laden / wissen (UI -> GL -> UI) ----
    @Volatile var requestSave = false            // UI vraagt; GL serialiseert
    @Volatile var requestLoad = false            // UI vraagt; GL leest [loadJson]
    @Volatile var requestClear = false           // UI vraagt; GL wist de wereld
    /** JSON van de wereld, door de UI gezet voor het laden (GL-thread leest) */
    @Volatile var loadJson: String? = null
    /** GL-thread levert hier de geserialiseerde wereld aan (UI schrijft naar prefs) */
    @Volatile var onWorldSaved: ((String) -> Unit)? = null

    // ================================================== selectie
    @Volatile var selKind = SEL_NONE
    @Volatile var selId = -1
    /** wordt door de GL-thread aangeroepen op de main thread (kind, id) */
    @Volatile var onSelectionChanged: ((Int, Int) -> Unit)? = null
    private val mainHandler = Handler(Looper.getMainLooper())

    // parameters van het geselecteerde object (UI schrijft, GL past toe)
    @Volatile private var pendingInterval = -1f
    @Volatile private var pendingSize = -1f
    @Volatile private var pendingAngle = -1f
    @Volatile private var pendingSpeed = -1f
    @Volatile private var pendingWave = -1
    @Volatile private var pendingVol = -1f
    @Volatile private var pendingBounce = -1f
    @Volatile private var pendingWeight = -1            // -1 niets, 0..100 gewicht
    @Volatile private var pendingVelDb = -999.0         // -999 niets, anders 0..-24 dB
    // ---- modus / FM / startpunt van de geselecteerde spawner (UI -> GL) ----
    @Volatile private var pendingMode = -1
    @Volatile private var pendingFmOn = -1          // -1 niets, 0 uit, 1 aan
    private val pendingFmEn = IntArray(4) { -1 }     // -1 niets, 0 uit, 1 aan
    private val pendingFmRatio = FloatArray(4) { -1f }
    private val pendingFmIdx = FloatArray(4) { -1f }
    @Volatile private var pendingSampleStart = -1f
    @Volatile private var pendingAtk = -1.0
    @Volatile private var pendingDcy = -1.0
    @Volatile private var pendingRel = -1.0

    // ================================================== touch-requests (UI -> GL)
    @Volatile private var requestSpawner = false
    @Volatile private var reqSpawnerX = 0f
    @Volatile private var reqSpawnerY = 0f
    @Volatile private var requestSelect = false
    @Volatile private var reqSelectX = 0f
    @Volatile private var reqSelectY = 0f
    @Volatile private var requestDelete = false
    @Volatile private var requestWall = false
    @Volatile private var reqWallX0 = 0f
    @Volatile private var reqWallY0 = 0f
    @Volatile private var reqWallX1 = 0f
    @Volatile private var reqWallY1 = 0f

    // ---- ladder + sample requests (UI -> GL) ----
    /** gewenste ladder (0..4); GL-thread past hem toe met noot-remap */
    @Volatile var requestScale = -1
    @Volatile var requestRoot = -1
    /** opname klaar: spawner-id + sample; GL-thread koppelt hem aan de spawner */
    @Volatile private var pendingSampleSpId = -1
    @Volatile private var pendingSample: SampleData? = null
    /** UI-callback na het koppelen (bijv. paneel verversen) */
    @Volatile var onSampleReady: ((Int, Float) -> Unit)? = null

    /** UI-thread: opgenomen sample afleveren bij spawner spId */
    fun setPendingSample(spId: Int, smp: SampleData?) {
        pendingSample = smp
        pendingSampleSpId = spId
    }
    /** duur van de sample van de geselecteerde spawner (voor de status-tekst) */
    fun getSelSampleSec(): Float =
        selectedSpawner()?.sample?.let { it.data.size.toFloat() / it.sampleRate } ?: 0f

    /** muur-voorbeeld terwijl je sleept (preview), UI schrijft, GL leest */
    @Volatile var dragWallActive = false
    @Volatile var dragX0 = 0f
    @Volatile var dragY0 = 0f
    @Volatile var dragX1 = 0f
    @Volatile var dragY1 = 0f

    /** swipe-duw: UI accumuleert, GL consumeert en reset */
    @Volatile private var swipeX = 0f
    @Volatile private var swipeY = 0f
    @Volatile private var swipeDx = 0f
    @Volatile private var swipeDy = 0f
    @Volatile private var swipeActive = false

    // ================================================== camera (UI past aan)
    @Volatile var camDistance = 17f
    @Volatile var camTargetX = 0f    // zoom-mikpunt: de camera kijkt hiernaartoe
    @Volatile var camTargetY = 1.2f   // (verschuift mee bij zoomen op een punt)

    // camera-frame-state: GL vult, UI leest in planePoint (goedaardige race,
    // hetzelfde @Volatile-patroon als in eerdere versies)
    @Volatile private var eyeX = 0f
    @Volatile private var eyeY = 0f
    @Volatile private var eyeZ = 17f
    private val axX = FloatArray(3)
    private val axY = FloatArray(3)
    private val axZ = FloatArray(3)
    @Volatile private var surfaceW = 1
    @Volatile private var surfaceH = 1
    /** true zodra de eerste frame de camera-assen heeft gevuld (GL-thread) */
    private var cameraReady = false

    // ================================================== OpenGL-handles
    private var program = 0
    private var aPosition = 0
    private var aNormal = 0
    private var aColor = 0
    private var aAlpha = 0
    private var uMVP = 0
    private var uModel = 0
    private var uLightDir = 0
    private var uLit = 0

    private var spherePosBuf = 0
    private var sphereNrmBuf = 0
    private var sphereABuf = 0
    private var sphereIdxBuf = 0
    private var sphereVertCount = 0
    private var sphereIdxCount = 0
    private var cubePosBuf = 0
    private var cubeNrmBuf = 0
    private var cubeABuf = 0
    private var cubeIdxBuf = 0
    private var bdPosBuf = 0
    private var bdNrmBuf = 0
    private var bdColBuf = 0
    private var bdABuf = 0
    private var bdIdxBuf = 0

    // trail: 1 dynamische buffer voor alle ballen samen (1 draw call);
    // per segment 6 vertices met positie + kleur + alpha
    private val trailQuads = BALL_MAX * (TRAIL_PTS - 1)
    private val trailPos = FloatArray(trailQuads * 6 * 3)
    private val trailCol = FloatArray(trailQuads * 6 * 3)
    private val trailAlp = FloatArray(trailQuads * 6)
    private var trailPosBuf = 0
    private var trailColBuf = 0
    private var trailAlpBuf = 0
    private val trailPosUpload = floatBuffer(trailPos)
    private val trailColUpload = floatBuffer(trailCol)
    private val trailAlpUpload = floatBuffer(trailAlp)
    /** globale trail-sterkte (0 = onzichtbaar); UI schrijft, GL-thread leest */
    @Volatile var trailStrength = 0.5f

    private val viewM = FloatArray(16)
    private val projM = FloatArray(16)
    private val tmpM = FloatArray(16)
    private val modelM = FloatArray(16)
    private val mvpM = FloatArray(16)
    private val ballColorScratch = FloatArray((SECTORS + 2) * 3)
    private val wallColorScratch = FloatArray(72)
    // herbruikbare upload-buffers: geen per-frame allocaties op de GL-thread
    private val ballUpload = floatBuffer(FloatArray((SECTORS + 2) * 3))
    private val wallUpload = floatBuffer(FloatArray(72))
    private var lastSelKey = ""
    private var sceneInitialized = false

    // ================================================================ setup

    override fun onSurfaceCreated(gl: GL10?, config: EGLConfig?) {
        val vs = compileShader(
            GL_VERTEX_SHADER, """
uniform mat4 uMVP;
uniform mat4 uModel;
attribute vec3 aPosition;
attribute vec3 aNormal;
attribute vec3 aColor;
attribute float aAlpha;
varying vec3 vColor;
varying vec3 vNormal;
varying float vAlpha;
void main() {
  gl_Position = uMVP * vec4(aPosition, 1.0);
  vColor = aColor;
  vNormal = mat3(uModel) * aNormal;
  vAlpha = aAlpha;
}
"""
        )
        val fs = compileShader(
            GL_FRAGMENT_SHADER, """
precision mediump float;
varying vec3 vColor;
varying vec3 vNormal;
varying float vAlpha;
uniform vec3 uLightDir;
uniform float uLit;
void main() {
  // 1 = met richtingslicht (muren/pijlen/achtergrond),
  // 0 = platte volle kleur (ballen, markers, trails)
  float k = 1.0;
  if (uLit > 0.5) k = 0.35 + 0.75 * max(dot(normalize(vNormal), normalize(uLightDir)), 0.0);
  gl_FragColor = vec4(vColor * k, vAlpha);
}
"""
        )
        program = glCreateProgram()
        glAttachShader(program, vs)
        glAttachShader(program, fs)
        glLinkProgram(program)
        glUseProgram(program)

        aPosition = glGetAttribLocation(program, "aPosition")
        aNormal = glGetAttribLocation(program, "aNormal")
        aColor = glGetAttribLocation(program, "aColor")
        aAlpha = glGetAttribLocation(program, "aAlpha")
        uMVP = glGetUniformLocation(program, "uMVP")
        uModel = glGetUniformLocation(program, "uModel")
        uLightDir = glGetUniformLocation(program, "uLightDir")
        uLit = glGetUniformLocation(program, "uLit")

        buildGeometry()

        // BELANGRIJKE FIX (uit de kubus-versie): ook het kleur-attribuut
        // echt enablen. Zonder glEnableVertexAttribArray gebruikt GL de
        // standaard attribuutwaarde (0,0,0) en zijn alle ballen zwart.
        glEnableVertexAttribArray(aPosition)
        glEnableVertexAttribArray(aNormal)
        glEnableVertexAttribArray(aColor)
        glEnableVertexAttribArray(aAlpha)

        glEnable(GL_DEPTH_TEST)

        if (!sceneInitialized) {
            sceneInitialized = true
            // lege start: geen spawner, geen muren, geen ballen
        } else {
            // bij OpenGL-context-verlies: kleurbuffers opnieuw aanmaken
            for (b in balls) b.colorBuf = 0
            for (w in walls) { w.colorBuf = 0; w.dirtyColor = true }
            for (sp in spawners) sp.colorBuf = 0
        }
    }

    override fun onSurfaceChanged(gl: GL10?, width: Int, height: Int) {
        surfaceW = maxOf(1, width)
        surfaceH = maxOf(1, height)
        glViewport(0, 0, width, height)
    }

    private fun compileShader(type: Int, src: String): Int {
        val s = glCreateShader(type)
        glShaderSource(s, src)
        glCompileShader(s)
        return s
    }

    private fun genBuffer(): Int {
        val a = IntArray(1)
        glGenBuffers(1, a, 0)
        return a[0]
    }

    private fun floatBuffer(a: FloatArray) =
        ByteBuffer.allocateDirect(a.size * 4).order(ByteOrder.nativeOrder())
            .asFloatBuffer().apply { put(a); position(0) }

    private fun shortBuffer(a: ShortArray) =
        ByteBuffer.allocateDirect(a.size * 2).order(ByteOrder.nativeOrder())
            .asShortBuffer().apply { put(a); position(0) }

    private fun uploadFloats(data: FloatArray): Int {
        val id = genBuffer()
        glBindBuffer(GL_ARRAY_BUFFER, id)
        glBufferData(GL_ARRAY_BUFFER, data.size * 4, floatBuffer(data), GL_STATIC_DRAW)
        return id
    }

    private fun uploadShorts(target: Int, data: ShortArray): Int {
        val id = genBuffer()
        glBindBuffer(target, id)
        glBufferData(target, data.size * 2, shortBuffer(data), GL_STATIC_DRAW)
        return id
    }

    private fun buildGeometry() {
        // ---- platte schijf (i.p.v. 3D-bol): middelpunt + SECTORS+1 rand,
        //      genormaliseerd in het XY-vlak met normaal (0,0,1) ----
        val vertCount = SECTORS + 2
        val pos = FloatArray(vertCount * 3)
        val nrm = FloatArray(vertCount * 3)
        val alpha = FloatArray(vertCount)
        pos[0] = 0f; pos[1] = 0f; pos[2] = 0f          // middelpunt
        nrm[2] = 1f
        alpha[0] = 1f
        for (s in 0..SECTORS) {
            val th = 2.0 * Math.PI * s / SECTORS
            val i = s + 1
            pos[i * 3] = cos(th).toFloat()
            pos[i * 3 + 1] = sin(th).toFloat()
            pos[i * 3 + 2] = 0f
            nrm[i * 3 + 2] = 1f
            alpha[i] = 1f
        }
        sphereVertCount = vertCount
        val idx = ShortArray(SECTORS * 3)              // driehoek-fan
        var k = 0
        for (s in 0 until SECTORS) {
            idx[k++] = 0.toShort()
            idx[k++] = (s + 1).toShort()
            idx[k++] = (s + 2).toShort()
        }
        sphereIdxCount = idx.size
        spherePosBuf = uploadFloats(pos)
        sphereNrmBuf = uploadFloats(nrm)
        sphereABuf = uploadFloats(alpha)
        sphereIdxBuf = uploadShorts(GL_ELEMENT_ARRAY_BUFFER, idx)

        // ---- kubus (muren): 24 vertices, 36 indices ----
        val cubePos = floatArrayOf(
            -1f, -1f, 1f, 1f, -1f, 1f, 1f, 1f, 1f, -1f, 1f, 1f,
            1f, -1f, -1f, -1f, -1f, -1f, -1f, 1f, -1f, 1f, 1f, -1f,
            -1f, 1f, 1f, 1f, 1f, 1f, 1f, 1f, -1f, -1f, 1f, -1f,
            -1f, -1f, -1f, 1f, -1f, -1f, 1f, -1f, 1f, -1f, -1f, 1f,
            1f, -1f, 1f, 1f, -1f, -1f, 1f, 1f, -1f, 1f, 1f, 1f,
            -1f, -1f, -1f, -1f, -1f, 1f, -1f, 1f, 1f, -1f, 1f, -1f
        )
        val cubeNrm = FloatArray(72)
        for (f in 0 until 6) {
            val n = CUBE_FACE_NORMALS[f]
            for (v in 0 until 4) {
                val d = (f * 4 + v) * 3
                cubeNrm[d] = n[0]; cubeNrm[d + 1] = n[1]; cubeNrm[d + 2] = n[2]
            }
        }
        val cubeIdx = ShortArray(36)
        for (f in 0 until 6) {
            val b = f * 4
            for (t in 0 until 6) cubeIdx[f * 6 + t] = (CUBE_TRI[t] + b).toShort()
        }
        cubePosBuf = uploadFloats(cubePos)
        cubeNrmBuf = uploadFloats(cubeNrm)
        cubeABuf = uploadFloats(FloatArray(24) { 1f })
        cubeIdxBuf = uploadShorts(GL_ELEMENT_ARRAY_BUFFER, cubeIdx)

        // ---- backdrop: donkere achtergrond achter het speelvlak
        // (vaste buffer; in de frame geschaald met het veld: 1,5x breed, 1x hoog) ----
        val g = 0.12f
        val bdPos = floatArrayOf(
            -450f, -300f, -1.2f, 450f, -300f, -1.2f, 450f, 300f, -1.2f, -450f, 300f, -1.2f
        )
        val bdNrm = floatArrayOf(0f, 0f, 1f, 0f, 0f, 1f, 0f, 0f, 1f, 0f, 0f, 1f)
        val bdCol = floatArrayOf(g * 0.8f, g, g * 1.5f, g * 0.8f, g, g * 1.5f, g * 0.8f, g, g * 1.5f, g * 0.8f, g, g * 1.5f)
        val bdIdx = shortArrayOf(0, 1, 2, 0, 2, 3)
        bdPosBuf = uploadFloats(bdPos)
        bdNrmBuf = uploadFloats(bdNrm)
        bdColBuf = uploadFloats(bdCol)
        bdABuf = uploadFloats(FloatArray(4) { 1f })
        bdIdxBuf = uploadShorts(GL_ELEMENT_ARRAY_BUFFER, bdIdx)

        // trail-buffers (leeg; de inhoud wordt per frame dynamisch gevuld)
        trailPosBuf = genBuffer()
        trailColBuf = genBuffer()
        trailAlpBuf = genBuffer()
    }

    private val CUBE_TRI = intArrayOf(0, 1, 2, 0, 2, 3)

    // ================================================================ wiskunde

    /** out = a * b (kolom-majeur) */
    private fun mat4Mul(out: FloatArray, a: FloatArray, b: FloatArray): FloatArray {
        for (c in 0..3) {
            for (r in 0..3) {
                out[c * 4 + r] =
                    a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] +
                    a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3]
            }
        }
        return out
    }

    /** out = T(x,y,0) * Rz(angleDeg) * S(sx,sy,sz) */
    private fun composeTRS(out: FloatArray, x: Float, y: Float, angleDeg: Float,
                           sx: Float, sy: Float, sz: Float) {
        val a = Math.toRadians(angleDeg.toDouble())
        val c = cos(a).toFloat()
        val s = sin(a).toFloat()
        out[0] = c * sx; out[1] = s * sx; out[2] = 0f; out[3] = 0f
        out[4] = -s * sy; out[5] = c * sy; out[6] = 0f; out[7] = 0f
        out[8] = 0f; out[9] = 0f; out[10] = sz; out[11] = 0f
        out[12] = x; out[13] = y; out[14] = 0f; out[15] = 1f
    }

    private fun hslToRgb(hDeg: Float, s: Float, l: Float): FloatArray {
        val c = (1f - abs(2f * l - 1f)) * s
        val hp = (((hDeg % 360f) + 360f) % 360f) / 60f
        val x = c * (1f - abs(hp % 2f - 1f))
        var r = 0f; var g = 0f; var b = 0f
        when {
            hp < 1f -> { r = c; g = x }
            hp < 2f -> { r = x; g = c }
            hp < 3f -> { g = c; b = x }
            hp < 4f -> { g = x; b = c }
            hp < 5f -> { r = x; b = c }
            else -> { r = c; b = x }
        }
        val m = l - c / 2f
        return floatArrayOf(minOf(1f, r + m), minOf(1f, g + m), minOf(1f, b + m))
    }

    /** Projecteert een schermpixel op het speelvlak (z = 0). UI-thread leest
     *  de camera van de laatste GL-frame (goedaardige race). */
    private fun planePoint(px: Float, py: Float): FloatArray? {
        val w = surfaceW.toFloat()
        val h = surfaceH.toFloat()
        if (w <= 0f || h <= 0f) return null
        val nx = px / w * 2f - 1f
        val ny = 1f - py / h * 2f
        val aspect = w / h
        val tanH = tan(Math.toRadians(25.0)).toFloat()
        var dx = axX[0] * nx * tanH * aspect + axY[0] * ny * tanH - axZ[0]
        var dy = axX[1] * nx * tanH * aspect + axY[1] * ny * tanH - axZ[1]
        var dz = axX[2] * nx * tanH * aspect + axY[2] * ny * tanH - axZ[2]
        val l = sqrt(dx * dx + dy * dy + dz * dz)
        if (l < 1e-6f) return null
        dx /= l; dy /= l; dz /= l
        if (abs(dz) < 1e-4f) return null
        val t = -eyeZ / dz
        if (t <= 0.1f) return null
        return floatArrayOf(eyeX + dx * t, eyeY + dy * t)
    }

    /** Maximale uitzoom: dynamisch, zodat het HELE speelveld
     *  (de instelbare afmetingen fieldHalfX/Y) op het scherm past,
     *  in elke scherm-verhouding. Per veldhoek volgt uit de projectie hoe ver de
     *  camera minstens weg moet staan:
     *    d >= hoekpunt.kijk-as + max(|scherm-x| / (TANH*aspect), |scherm-y| / TANH)
     *  De grootste van de vier hoeken, met 5% marge, is de uitzoomgrens.
     *  De camera staat haaks boven het veld, dus de camera-as is altijd
     *  gelijk; gelezen
     *  worden alleen @Volatile velden, dus veilig vanaf elke thread. */
    private fun maxCamDist(): Float {
        if (surfaceW <= 0 || surfaceH <= 0) return CAM_MIN_DIST
        val aspect = surfaceW.toFloat() / surfaceH.toFloat()
        // kijk-as (zelfde assen als in onDrawFrame): recht van boven
        val zx = CAM_DX; val zy = CAM_DY; val zz = CAM_DZ
        var xx = zz; val xy = 0f; var xz = -zx
        var l = sqrt(xx * xx + xz * xz)
        xx /= l; xz /= l
        val yx = zy * xz - zz * xy
        val yy = zz * xx - zx * xz
        val yz = zx * xy - zy * xx
        val tanH = tan(Math.toRadians(25.0)).toFloat()
        var m = 0f
        for (sy in -1..1 step 2) for (sx in -1..1 step 2) {
            val qx = sx * fieldHalfX - camTargetX
            val qy = sy * fieldHalfY - camTargetY
            val wq = qx * zx + qy * zy            // hoekpunt . kijk-as (vlak z=0)
            val px = qx * xx + qy * xy            // scherm-x van het hoekpunt
            val py = qx * yx + qy * yy            // scherm-y van het hoekpunt
            m = maxOf(m, wq + maxOf(abs(px) / (tanH * aspect), abs(py) / tanH))
        }
        return maxOf(CAM_MIN_DIST, m * 1.05f)     // 5% marge rond het veld
    }

    /* Zoom naar een punt: het wereldpunt onder de vingers blijft op zijn eigen
     * pixel zitten. eye = T + dist*richting; met T' = P + k*(T-P) en
     * dist' = k*dist geldt exact eye' = P + k*(eye-P). Het mikpunt blijft
     * op het speelvlak (z=0), dus ronddraaien blijft simpel. */
    private fun zoomAtWorld(p: FloatArray?, k: Float) {
        val nd = (camDistance * k).coerceIn(CAM_MIN_DIST, maxCamDist())
        val kk = nd / camDistance
        camDistance = nd
        if (p == null || abs(kk - 1f) < 1e-4f) return
        // mikpunt blijft binnen het HELE veld (net als panCam/setFieldSize:
        // anders trekt het zoomen het mikpunt terug dat het pannen naar
        // de rand schoof)
        camTargetX = (p[0] + (camTargetX - p[0]) * kk).coerceIn(-fieldHalfX, fieldHalfX)
        camTargetY = (p[1] + (camTargetY - p[1]) * kk).coerceIn(-fieldHalfY, fieldHalfY)
    }

    /** Pannen met 2 vingers (zoals Google Maps): de camera schuift over het
     *  veld, het mikpunt blijft binnen het HELE speelveld. UI-thread
     *  (@Volatile-velden, lockvrij). */
    fun panCam(dx: Float, dy: Float) {
        camTargetX = (camTargetX + dx).coerceIn(-fieldHalfX, fieldHalfX)
        camTargetY = (camTargetY + dy).coerceIn(-fieldHalfY, fieldHalfY)
    }

    /** planePoint met een expliciete camera (mikpunt + afstand), in plaats
     *  van de camera van de laatste GL-frame: de UI-thread rekent eye/assen
     *  zelf, zodat pan/zoom-delta's ook kloppen als er meerdere
     *  touch-events binnen één GL-frame komen (hetzelfde idee als
     *  syncCamera in de preview). */
    private fun planePointCam(px: Float, py: Float, tx: Float, ty: Float, dist: Float): FloatArray? {
        val w = surfaceW.toFloat()
        val h = surfaceH.toFloat()
        if (w <= 0f || h <= 0f) return null
        // oog recht boven het mikpunt (haaks op het speelveld)
        val ex = tx + dist * CAM_DX
        val ey = ty + dist * CAM_DY
        val ez = CENTER_Z + dist * CAM_DZ
        var zx = ex - tx; var zy = ey - ty; var zz = ez - CENTER_Z
        var l = sqrt(zx * zx + zy * zy + zz * zz)
        zx /= l; zy /= l; zz /= l
        var xx = zz; val xy = 0f; var xz = -zx
        var l = sqrt(xx * xx + xz * xz)
        xx /= l; xz /= l
        val yx = zy * xz - zz * xy
        val yy = zz * xx - zx * xz
        val yz = zx * xy - zy * xx
        val nx = px / w * 2f - 1f
        val ny = 1f - py / h * 2f
        val aspect = w / h
        val tanH = tan(Math.toRadians(25.0)).toFloat()
        var dx = xx * nx * tanH * aspect + yx * ny * tanH - zx
        var dy = xy * nx * tanH * aspect + yy * ny * tanH - zy
        var dz = xz * nx * tanH * aspect + yz * ny * tanH - zz
        l = sqrt(dx * dx + dy * dy + dz * dz)
        if (l < 1e-6f) return null
        dx /= l; dy /= l; dz /= l
        if (abs(dz) < 1e-4f) return null
        val t = -ez / dz
        if (t <= 0.1f) return null
        return floatArrayOf(ex + dx * t, ey + dy * t)
    }

    fun resetCam() {
        camTargetX = CENTER_X; camTargetY = CENTER_Y
        camDistance = 17f
    }

    /** Veldafmeting instellen (halve breedte/hoogte, geklemd op 50..300);
     *  het zoom-mikpunt kan buiten het verkleinde veld liggen en schuift
     *  terug binnen de klemmen (het HELE veld, net als bij pan/zoom). */
    fun setFieldSize(hx: Float, hy: Float) {
        fieldHalfX = hx.coerceIn(FIELD_HALF_MIN, FIELD_HALF_MAX)
        fieldHalfY = hy.coerceIn(FIELD_HALF_MIN, FIELD_HALF_MAX)
        camTargetX = camTargetX.coerceIn(-fieldHalfX, fieldHalfX)
        camTargetY = camTargetY.coerceIn(-fieldHalfY, fieldHalfY)
    }

    // ================================================================ wereld

    private fun addWall(x0: Float, y0: Float, x1: Float, y1: Float, rest: Float): Wall {
        val w = Wall(++wallSeq)
        w.x0 = x0; w.y0 = y0; w.x1 = x1; w.y1 = y1; w.rest = rest
        w.colorBuf = genBuffer()
        walls.add(w)
        return w
    }

    private fun addSpawner(x: Float, y: Float): Spawner {
        val sp = Spawner(++spawnerSeq)
        // altijd (net) binnen het veld plaatsen: een spawner op of buiten
        // de rand spawnt ballen die direct weer despawnen en lijken "dood"
        sp.x = x.coerceIn(-fieldHalfX + 1.2f, fieldHalfX - 1.2f)
        sp.y = y.coerceIn(-fieldHalfY + 1.2f, fieldHalfY - 1.2f)
        // toon = absolute plek op het canvas (basis voor de sampler-opname);
        // bij botsingen wordt de toon live opnieuw berekend
        sp.note = posPitch(y)
        // ADR-envelope: nieuwe spawner erft de globale standaard-instellingen
        sp.atk = synth.attackSec
        sp.dcy = synth.decaySec
        sp.rel = synth.releaseSec
        // velocity-diepte: nieuwe spawner erft de globale standaard uit Instellingen
        sp.velDb = synth.velocityDepthDb
        sp.colorBuf = genBuffer()
        spawners.add(sp)
        pushFm(sp)   // FM-defaults naar de audio-thread
        return sp
    }

    private fun findSpawner(id: Int): Spawner? = spawners.firstOrNull { it.id == id }
    private fun findWall(id: Int): Wall? = walls.firstOrNull { it.id == id }
    private fun selectedSpawner(): Spawner? =
        if (selKind == SEL_SPAWNER) findSpawner(selId) else null
    private fun selectedWall(): Wall? =
        if (selKind == SEL_WALL) findWall(selId) else null

    /** UI-thread: parameters van de selectie lezen (voor het panel) */
    fun getSelInterval(): Float = selectedSpawner()?.interval ?: 1.5f
    fun getSelSize(): Float = selectedSpawner()?.size ?: 0.7f
    /** noot van de spawner (absolute plek op het canvas bij plaatsing;
     *  basis voor de sampler-opname; de Starttoon-slider is weg) */
    fun getSelPitch(): Float = selectedSpawner()?.note ?: 440f
    fun getSelAngle(): Float = selectedSpawner()?.angle ?: 270f
    fun getSelSpeed(): Float = selectedSpawner()?.speed ?: 25f
    /** gewicht van de spawner (0..100): x0,1..x1,9 zwaartekracht + duw-weerstand */
    fun getSelWeight(): Int = selectedSpawner()?.weight ?: 50
    /** velocity-diepte in dB (0..-24): volume bij laagste snelheid; -8 standaard */
    fun getSelVelDb(): Double = selectedSpawner()?.velDb ?: synth.velocityDepthDb
    fun getSelWave(): Int = selectedSpawner()?.wave ?: 0
    fun getSelVol(): Float = selectedSpawner()?.vol ?: 1f
    fun getSelBounce(): Float = selectedWall()?.rest ?: 0.85f

    /** UI-thread: parameters van de selectie schrijven (GL past toe) */
    fun setSelInterval(v: Float) { pendingInterval = v }
    fun setSelSize(v: Float) { pendingSize = v }
    fun setSelAngle(v: Float) { pendingAngle = v }
    fun setSelSpeed(v: Float) { pendingSpeed = v }
    fun setSelWeight(v: Int) { pendingWeight = v }
    fun setSelVelDb(v: Double) { pendingVelDb = v }
    fun setSelWave(v: Int) { pendingWave = v }
    fun setSelVol(v: Float) { pendingVol = v }
    fun setSelBounce(v: Float) { pendingBounce = v }

    /** UI-thread: globale trail-sterkte 0..1 (0 = onzichtbaar) */
    fun setTrailStrength(v: Float) { trailStrength = v.coerceIn(0f, 1f) }
    /** stem-pool (Globaal): max aantal gelijktijdige stemmen (8..64) */
    fun setVoicePool(n: Int) { synth.maxVoices = n.coerceIn(1, 64) }
    /** stem-pool (Globaal): verste stem stelen i.p.v. de oudste */
    fun setStealFurthest(on: Boolean) { synth.stealFurthest = on }
    fun getVoicePool(): Int = synth.maxVoices
    fun getStealFurthest(): Boolean = synth.stealFurthest
    fun getTrailStrength(): Float = trailStrength

    // ---- spawner-modus / FM / sample-startpunt (UI leest en schrijft) ----
    fun getSelMode(): Int = selectedSpawner()?.mode ?: MODE_SYNTH
    fun getSelFmOn(): Boolean = selectedSpawner()?.fmOn ?: false
    fun getSelFmEn(k: Int): Boolean = selectedSpawner()?.fmEn?.get(k) ?: false
    fun getSelFmRatio(k: Int): Float = selectedSpawner()?.fmRatio?.get(k) ?: 1f
    fun getSelFmIdx(k: Int): Float = selectedSpawner()?.fmIdx?.get(k) ?: 1f
    fun getSelSampleStart(): Float = selectedSpawner()?.sample?.start ?: 0f
    fun getSelSample(): SampleData? = selectedSpawner()?.sample
    fun setSelMode(m: Int) { pendingMode = m }
    fun setSelFmOn(on: Boolean) { pendingFmOn = if (on) 1 else 0 }
    fun setSelFmEn(k: Int, on: Boolean) { pendingFmEn[k] = if (on) 1 else 0 }
    fun setSelFmRatio(k: Int, v: Float) { pendingFmRatio[k] = v }
    fun setSelFmIdx(k: Int, v: Float) { pendingFmIdx[k] = v }
    fun setSelSampleStart(v: Float) { pendingSampleStart = v }
    fun getSelAtk(): Double = selectedSpawner()?.atk ?: synth.attackSec
    fun getSelDcy(): Double = selectedSpawner()?.dcy ?: synth.decaySec
    fun getSelRel(): Double = selectedSpawner()?.rel ?: synth.releaseSec
    fun setSelAtk(v: Double) { pendingAtk = v }
    fun setSelDcy(v: Double) { pendingDcy = v }
    fun setSelRel(v: Double) { pendingRel = v }

    /** FM-instellingen van een spawner naar de audio-thread pushen (copy-on-write) */
    private fun pushFm(sp: Spawner) {
        val mods = Array(4) { k -> FmMod(sp.fmEn[k], sp.fmRatio[k], sp.fmIdx[k]) }
        synth.setFm(sp.id, FmVoice(sp.fmOn, mods))
    }
    fun deleteSelected() { requestDelete = true }

    private fun notifySelection() {
        val k = selKind
        val id = selId
        mainHandler.post { onSelectionChanged?.invoke(k, id) }
    }

    /** GL-thread: ladder wisselen. De toonhoogte wordt live uit de positie +
     *  de actieve ladder berekend (absolute hoogte-schaal), dus hoeft er
     *  niets geremapt te worden: elke volgende botsing klikt op de nieuwe
     *  ladder, het klinkt als een modulatie van het hele canvas. */
    private fun applyScale(newIdx: Int) {
        val idx = newIdx.coerceIn(0, SCALE_NAMES.size - 1)
        if (idx == scaleIdx) return
        scaleIdx = idx
        notifySelection()   // paneel toont de nieuwe ladder
    }

    /** GL-thread: grondtoon wisselen (zelfde gedrag als applyScale: de
     *  toon wordt live berekend, geen remap nodig). */
    private fun applyRoot(newRoot: Int) {
        val root = newRoot.coerceIn(0, 11)
        if (root == rootSemi) return
        rootSemi = root
        notifySelection()
    }

    private fun spawnBall(sp: Spawner) {
        var slot: Ball? = balls.firstOrNull { !it.active }
        if (slot == null) {
            // pool vol: oudste gespawnde bal hergebruiken
            var oldest: Ball? = null
            for (b in balls) {
                if (b.spawned && (oldest == null || b.bornNs < oldest.bornNs)) oldest = b
            }
            slot = oldest ?: return
        }
        val b = slot
        b.active = true
        b.spawned = true
        b.bornNs = System.nanoTime()
        // volledig deterministisch: zelfde startpunt, zelfde richting, geen timing-variatie
        val a = Math.toRadians(sp.angle.toDouble())
        // spawnpunt VOLLEDIG binnen het veld klemmen (bijv. na het
        // verkleinen van het veld): een bal die volledig buiten de
        // randen spawnt wordt in dezelfde physics-stap alweer
        // gedespawnd, je ziet dan niks verschijnen
        val r0 = sp.size
        b.x = sp.x.coerceIn(-fieldHalfX + r0, fieldHalfX - r0)
        b.y = sp.y.coerceIn(-fieldHalfY + r0, fieldHalfY - r0)
        b.vx = (sp.speed * Math.cos(a)).toFloat()
        b.vy = (sp.speed * Math.sin(a)).toFloat()
        b.r = sp.size
        b.hue = sp.hue
        b.note = posPitch(b.y)                     // toon = plek op het canvas (absolute schaal)
        b.wave = sp.wave
        b.vol = sp.vol
        b.spId = sp.id
        b.angle = 0f
        b.spin = 40f
        b.flash = 0f
        b.wMul = 0.1f + 1.8f * sp.weight / 100f   // gewicht: x0,1..x1,9 zwaartekracht/duw
        b.trailLen = 0
        if (b.colorBuf == 0) b.colorBuf = genBuffer()
        uploadBallColors(b)
    }

    private fun resetPersistent() {
        // gespawnde ballen laten we staan; persistente ballen opnieuw vallen
        for (b in balls) if (!b.spawned) b.active = false
        val rnd = java.util.concurrent.ThreadLocalRandom.current()
        for (i in 0 until persistentCount) {
            val b = balls.firstOrNull { !it.active } ?: break
            b.active = true
            b.spawned = false
            b.bornNs = System.nanoTime()
            b.x = (i - (persistentCount - 1) / 2f) * 0.9f
            b.y = 7f + (i % 5) * 0.5f
            b.vx = (rnd.nextFloat() - 0.5f) * 0.5f
            b.vy = 0f
            b.r = 0.6f
            b.hue = (i * 137.5f) % 360f
            b.note = posPitch(b.y)                 // toon = plek op het canvas (absolute schaal)
            b.wave = 0
            b.vol = 1f
            b.spId = 0
            b.angle = rnd.nextFloat() * 360f
            b.spin = 40f
            b.flash = 0f
            b.wMul = 1f                        // persistente ballen: normaal gewicht
            b.trailLen = 0
            if (b.colorBuf == 0) b.colorBuf = genBuffer()
            uploadBallColors(b)
        }
    }

    // ================================================== wereld opslaan / laden
    // (org.json zit in Android zelf: geen externe dependencies)

    /** GL-thread: wereld + instellingen als JSON-tekst (UI schrijft het weg) */
    private fun serializeWorld(): String {
        val root = JSONObject()
        root.put("v", 5)
        root.put("scale", scaleIdx)
        root.put("root", rootSemi)
        root.put("oct", octaves)
        root.put("fw", fieldHalfX.toInt())   // veldafmetingen (halve breedte)
        root.put("fh", fieldHalfY.toInt())   // (halve hoogte)
        root.put("tr", (trailStrength * 100f).toInt())   // trail-sterkte 0..100
        root.put("mv", synth.maxVoices)                  // stem-pool-limiet (8..64)
        root.put("sm", if (synth.stealFurthest) 1 else 0)   // stelen: 0 = oudste, 1 = verste
        val sps = JSONArray()
        for (sp in spawners) {
            val o = JSONObject()
                .put("x", sp.x.toDouble()).put("y", sp.y.toDouble())
                .put("interval", sp.interval.toDouble()).put("size", sp.size.toDouble())
                .put("angle", sp.angle.toDouble()).put("speed", sp.speed.toDouble())
                .put("vol", sp.vol.toDouble())
                .put("weight", sp.weight)
                .put("vdb", sp.velDb)
                .put("wave", sp.wave)
                .put("mode", sp.mode)
                .put("atk", sp.atk).put("dcy", sp.dcy).put("rel", sp.rel)
                .put("fmOn", if (sp.fmOn) 1 else 0)
            val enA = JSONArray(); val rA = JSONArray(); val iA = JSONArray()
            for (k in 0 until 4) {
                enA.put(if (sp.fmEn[k]) 1 else 0)
                rA.put(sp.fmRatio[k].toDouble())
                iA.put(sp.fmIdx[k].toDouble())
            }
            o.put("fmEn", enA).put("fmR", rA).put("fmI", iA)
            sp.sample?.let { smp ->
                // Int16-PCM little-endian als base64 (compact genoeg voor SharedPreferences)
                val bytes = ByteArray(smp.data.size * 2)
                ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer()
                    .put(ShortArray(smp.data.size) { (smp.data[it] * 32767f).toInt().toShort() })
                o.put("smp", Base64.encodeToString(bytes, Base64.NO_WRAP))
                o.put("smpBase", smp.baseFreq.toDouble())
                o.put("smpRate", smp.sampleRate)
                o.put("smpStart", smp.start.toDouble())
            }
            sps.put(o)
        }
        root.put("spawners", sps)
        val ws = JSONArray()
        for (w in walls) {
            ws.put(JSONObject()
                .put("x0", w.x0.toDouble()).put("y0", w.y0.toDouble())
                .put("x1", w.x1.toDouble()).put("y1", w.y1.toDouble())
                .put("rest", w.rest.toDouble()))
        }
        root.put("walls", ws)
        root.put("cnt", persistentCount)
        root.put("cam", JSONObject()
            .put("dist", camDistance.toDouble())   // vaste kijkhoek: geen az/el meer
            .put("tx", camTargetX.toDouble())   // zoom-mikpunt
            .put("ty", camTargetY.toDouble()))
        root.put("synth", JSONObject()
            .put("attack", synth.attackSec)
            .put("decay", synth.decaySec)
            .put("release", synth.releaseSec)
            .put("velDb", synth.velocityDepthDb))
        return root.toString()
    }

    /** GL-buffers van de huidige wereld netjes vrijgeven (GL-thread) */
    private fun disposeWorldGl() {
        for (sp in spawners) {
            if (sp.colorBuf != 0) glDeleteBuffers(1, intArrayOf(sp.colorBuf), 0)
            if (sp.arrowBuf != 0) glDeleteBuffers(1, intArrayOf(sp.arrowBuf), 0)
            synth.setSample(sp.id, null)   // samples vrijgeven (id's kunnen hergebruikt worden)
            synth.setFm(sp.id, null)       // idem voor de FM-instellingen
        }
        for (w in walls) {
            if (w.colorBuf != 0) glDeleteBuffers(1, intArrayOf(w.colorBuf), 0)
        }
    }

    /** GL-thread: wereld uit JSON terugzetten (knop Laden) */
    private fun applyWorld(json: String) {
        val root = JSONObject(json)
        applyScale(root.optInt("scale", scaleIdx).coerceIn(0, SCALE_NAMES.size - 1))
        applyRoot(root.optInt("root", rootSemi).coerceIn(0, 11))
        // hoogte-op-Canvas; opslag van vóór deze instelling = standaard 4 octaven
        octaves = root.optInt("oct", 4).coerceIn(2, 6)
        // veldafmetingen eerst terugzetten (camTarget-klemmen en de
        // toonschaal hangen ervan af); opslag van vóór deze instelling
        // = de huidige afmeting
        if (root.has("fw") || root.has("fh"))
            setFieldSize(
                if (root.has("fw")) root.optInt("fw", 100).toFloat() else fieldHalfX,
                if (root.has("fh")) root.optInt("fh", 100).toFloat() else fieldHalfY
            )
        // trail-sterkte (opslag van vóór deze instelling = standaard 50%)
        if (root.has("tr")) setTrailStrength(root.optInt("tr", 50).coerceIn(0, 100) / 100f)
        // stem-pool (opslag van vóór v5 = de standaarden: 8 stemmen, oudste stelen)
        if (root.has("mv")) synth.maxVoices = root.optInt("mv", 8).coerceIn(1, 64)
        if (root.has("sm")) synth.stealFurthest = root.optInt("sm", 0) == 1
        disposeWorldGl()
        spawners.clear()
        walls.clear()
        val sps = root.optJSONArray("spawners") ?: JSONArray()
        for (i in 0 until sps.length()) {
            val s = sps.getJSONObject(i)
            val sp = addSpawner(s.getDouble("x").toFloat(), s.getDouble("y").toFloat())
            sp.interval = s.getDouble("interval").toFloat()
            sp.size = s.getDouble("size").toFloat()
            sp.angle = s.getDouble("angle").toFloat()
            sp.speed = s.getDouble("speed").toFloat()
            sp.vol = s.getDouble("vol").toFloat()
            // gewicht + velocity-diepte per spawner (opslag van vóór v4 = standaard)
            sp.weight = s.optInt("weight", 50).coerceIn(0, 100)
            sp.velDb = s.optDouble("vdb", synth.velocityDepthDb).coerceIn(-24.0, 0.0)
            // oude opslag (vóór de modus) had golf 4 = Sample: valt terug op sinus
            val w = s.optInt("wave", 0)
            sp.wave = if (w == 4) 0 else w.coerceIn(0, 3)
            // modus: nieuw veld; v2-opslag met opname = sampler
            sp.mode = when {
                s.optInt("mode", -1) == MODE_SAMPLER -> MODE_SAMPLER
                !s.has("mode") && s.has("smp") -> MODE_SAMPLER
                else -> MODE_SYNTH
            }
            // ADR per spawner; oudere opslag valt terug op de globale synth-instellingen
            sp.atk = s.optDouble("atk", synth.attackSec)
            sp.dcy = s.optDouble("dcy", synth.decaySec)
            sp.rel = s.optDouble("rel", synth.releaseSec)
            // FM: aan/uit + 4 modulators (met default-instellingen per slot)
            sp.fmOn = s.optInt("fmOn", 0) == 1
            val dR = floatArrayOf(1f, 2f, 3f, 0.5f)
            val dI = floatArrayOf(1f, 0.5f, 0.5f, 1f)
            val enA = s.optJSONArray("fmEn")
            val rA = s.optJSONArray("fmR")
            val iA = s.optJSONArray("fmI")
            for (k in 0 until 4) {
                val dEn = if (k == 0) 1 else 0
                sp.fmEn[k] = (enA?.optInt(k, dEn) ?: dEn) == 1
                sp.fmRatio[k] = (rA?.optDouble(k, dR[k].toDouble()) ?: dR[k].toDouble()).toFloat()
                sp.fmIdx[k] = (iA?.optDouble(k, dI[k].toDouble()) ?: dI[k].toDouble()).toFloat()
            }
            pushFm(sp)
            if (s.has("smp")) {
                // sample terugdecoderen: base64 -> Int16 LE -> float
                val bytes = Base64.decode(s.getString("smp"), Base64.NO_WRAP)
                val sh = ShortArray(bytes.size / 2)
                ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).asShortBuffer().get(sh)
                val data = FloatArray(sh.size) { sh[it] / 32768f }
                // bij het laden ook normaliseren (piek 0,95; oudere opnames
                // waren dat nog niet)
                var peak = 0f
                for (v in data) { val a = abs(v); if (a > peak) peak = a }
                if (peak > 1e-6f) {
                    val g = 0.95f / peak
                    for (k in data.indices) data[k] *= g
                }
                val smp = SampleData(
                    data,
                    s.optDouble("smpBase", 220.0).toFloat(),
                    s.optInt("smpRate", 48000)
                )
                smp.start = s.optDouble("smpStart", 0.0).toFloat().coerceIn(0f, 1f)
                sp.sample = smp
                synth.setSample(sp.id, smp)
            }
        }
        val ws = root.optJSONArray("walls") ?: JSONArray()
        for (i in 0 until ws.length()) {
            val w = ws.getJSONObject(i)
            val wall = addWall(
                w.getDouble("x0").toFloat(), w.getDouble("y0").toFloat(),
                w.getDouble("x1").toFloat(), w.getDouble("y1").toFloat(),
                w.optDouble("rest", 0.85).toFloat()
            )
        }
        persistentCount = root.optInt("cnt", persistentCount).coerceIn(1, BALL_MAX)
        val cam = root.optJSONObject("cam")
        if (cam != null) {
            // vaste kijkhoek: oude opslag met az/el laadt gewoon (genegeerd)
            camDistance = cam.optDouble("dist", 17.0).toFloat().coerceIn(CAM_MIN_DIST, maxCamDist())
            // zoom-mikpunt herstellen (oude opslag zonder tx/ty = het midden);
            // geklemd binnen het HELE veld
            camTargetX = cam.optDouble("tx", CENTER_X.toDouble()).toFloat().coerceIn(-fieldHalfX, fieldHalfX)
            camTargetY = cam.optDouble("ty", CENTER_Y.toDouble()).toFloat().coerceIn(-fieldHalfY, fieldHalfY)
        }
        val sy = root.optJSONObject("synth")
        if (sy != null) {
            synth.attackSec = sy.optDouble("attack", synth.attackSec)
            synth.decaySec = sy.optDouble("decay", synth.decaySec)
            synth.releaseSec = sy.optDouble("release", synth.releaseSec)
            synth.velocityDepthDb = sy.optDouble("velDb", synth.velocityDepthDb)
        }
        for (b in balls) { b.active = false; b.spawned = false }
        resetPersistent()   // persistente ballen vallen weer: de creatie leeft
        selKind = SEL_NONE
        selId = -1
        notifySelection()
    }

    /** GL-thread: het hele canvas leegmaken (knop Reset) */
    private fun clearWorld() {
        disposeWorldGl()
        spawners.clear()
        walls.clear()
        for (b in balls) { b.active = false; b.spawned = false }
        selKind = SEL_NONE
        selId = -1
        notifySelection()
    }

    // ================================================================ physics

    /** bal tegen muur (lijnstuk + dikte). true bij contact. */
    private fun collideBallWall(b: Ball, w: Wall, dt: Float): Boolean {
        val dx1 = w.x1 - w.x0
        val dy1 = w.y1 - w.y0
        val len2 = dx1 * dx1 + dy1 * dy1
        var t = 0f
        if (len2 > 1e-9f) {
            t = ((b.x - w.x0) * dx1 + (b.y - w.y0) * dy1) / len2
            t = t.coerceIn(0f, 1f)
        }
        val cx = w.x0 + dx1 * t
        val cy = w.y0 + dy1 * t
        var dx = b.x - cx
        var dy = b.y - cy
        var d = sqrt(dx * dx + dy * dy)
        val minD = b.r + WALL_HALF
        if (d >= minD) return false
        if (d < 1e-6f) { dx = 0f; dy = 1f; d = 1f }
        val nx = dx / d
        val ny = dy / d
        b.x = cx + nx * minD
        b.y = cy + ny * minD
        val vn = b.vx * nx + b.vy * ny
        if (vn < 0f) {
            val impact = -vn
            // onder REST_SPEED: geen bounce maar glijden/rusten
            val vnAfter = if (impact < REST_SPEED) 0f else impact * w.rest
            val tx = -ny
            val ty = nx
            var vt = b.vx * tx + b.vy * ty
            vt *= maxOf(0f, 1f - CONTACT_FRICTION * dt)
            b.vx = tx * vt + nx * vnAfter
            b.vy = ty * vt + ny * vnAfter
            b.spin = vt / b.r * 57.2958f          // rollen over het oppervlak
            if (impact > MIN_TONE_SPEED) {
                // toonhoogte = absolute plek op het canvas (midden = A4);
                // de 0,5 maakt de muurhit een octaaf lager.
                // Panning + buiten-beeld-demping volgen de plek op het scherm:
                // max 75% links/rechts; volledig ingezoomd klinkt wat je
                // niet ziet tot 8 dB zachter (uitgezoomd = alles gelijk).
                val sp = findSpawner(b.spId)
                val nd = ndcOf(b.x, b.y)
                val pan = (nd?.get(0) ?: 0f).coerceIn(-0.75f, 0.75f)
                synth.playCollision(impact, posPitch(b.y), 0.5f, b.wave, b.vol, b.spId, sp?.mode == MODE_SAMPLER,
                    (sp?.atk ?: synth.attackSec).toDouble(), (sp?.dcy ?: synth.decaySec).toDouble(), (sp?.rel ?: synth.releaseSec).toDouble(),
                    sp?.velDb ?: synth.velocityDepthDb,
                    pan, offscreenAtten(b.x, b.y),
                    // botsplek + cameramikpunt voor het stelen van stemmen
                    // (oudste of verste, afhankelijk van de instelling)
                    b.x, b.y, camTargetX, camTargetY)
            }
            if (impact > MIN_FLASH_SPEED) {
                b.flash = minOf(1f, 0.3f + impact * 0.12f)
            }
        }
        return true
    }

    private fun stepPhysics(dt: Float) {
        // ---- spawners ----
        for (sp in spawners) {
            sp.timer += dt
            if (sp.timer >= sp.interval) {
                sp.timer -= sp.interval   // -= houdt het ritme exact op het grid
                spawnBall(sp)
            }
        }

        // ---- swipe-duw (uit de UI-thread geaccumuleerd) ----
        if (swipeActive) {
            val px = swipeX
            val py = swipeY
            val dx = swipeDx
            val dy = swipeDy
            swipeActive = false
            swipeDx = 0f
            swipeDy = 0f
            for (b in balls) {
                if (!b.active) continue
                val d = sqrt((b.x - px) * (b.x - px) + (b.y - py) * (b.y - py))
                if (d > SWIPE_RADIUS + b.r) continue
                val falloff = 1f - maxOf(0f, d - b.r) / SWIPE_RADIUS
                // zwaardere ballen (hoge wMul) laten zich minder duwen
                val resist = 1f / b.wMul
                b.vx += dx * SWIPE_GAIN * falloff * resist
                b.vy += dy * SWIPE_GAIN * falloff * resist
            }
        }

        // ---- integratie ----
        val drag = maxOf(0f, 1f - AIR_DRAG * dt)
        for (b in balls) {
            if (!b.active) continue
            // zwaartekracht schaalt met het gewicht van de bal (spawner-instelling)
            b.vy -= GRAVITY * b.wMul * dt
            b.vx *= drag
            b.vy *= drag
            b.x += b.vx * dt
            b.y += b.vy * dt
            b.angle = (b.angle + b.spin * dt) % 360f
            if (abs(b.vx) + abs(b.vy) < REST_SPEED) b.spin *= 0.9f
        }

        // ---- muur-botsingen ----
        for (b in balls) {
            if (!b.active) continue
            for (w in walls) collideBallWall(b, w, dt)
        }

        // ---- bal-bal is bewust weg: ballen botsen alleen op muren ----

        // ---- plafond + despawn ----
        for (b in balls) {
            if (!b.active) continue
            val sp = sqrt(b.vx * b.vx + b.vy * b.vy)
            if (sp > MAX_SPEED) {
                val s = MAX_SPEED / sp
                b.vx *= s; b.vy *= s
            }
            if (b.y + b.r < -fieldHalfY || abs(b.x) - b.r > fieldHalfX) b.active = false
        }
    }

    // ================================================================ kleuren

    private fun uploadBallColors(b: Ball) {
        // platte schijf: één effen fellere kleur per bal (flash mengt naar
        // de botskleur), geen rol-schaduw meer want zonder 3D-look
        val base = hslToRgb(b.hue, 0.85f, 0.55f)
        val hit = hslToRgb(b.hue + 180f, 0.9f, 0.68f)
        val f = b.flash
        for (i in 0 until sphereVertCount) {
            val d = i * 3
            ballColorScratch[d] = base[0] + (hit[0] - base[0]) * f
            ballColorScratch[d + 1] = base[1] + (hit[1] - base[1]) * f
            ballColorScratch[d + 2] = base[2] + (hit[2] - base[2]) * f
        }
        glBindBuffer(GL_ARRAY_BUFFER, ballColorBuffer(b))
        // FIX uit de kubus-versie: glBufferData toewijzen, geen glBufferSubData
        // op een lege buffer (dat faalt stilletjes en geeft zwarte ballen).
        ballUpload.clear()
        ballUpload.put(ballColorScratch)
        ballUpload.position(0)
        glBufferData(GL_ARRAY_BUFFER, ballColorScratch.size * 4,
            ballUpload, GL_DYNAMIC_DRAW)
    }

    private fun ballColorBuffer(b: Ball): Int {
        if (b.colorBuf == 0) b.colorBuf = genBuffer()
        return b.colorBuf
    }

    private fun wallColor(w: Wall): FloatArray {
        val sel = selKind == SEL_WALL && selId == w.id
        return if (sel) floatArrayOf(0.95f, 0.95f, 1.0f)
        // rest <= 1: rood (dood) naar groen (bouncy); rest > 1: groen naar blauw (versneller)
        else hslToRgb(
            if (w.rest <= 1f) w.rest * 120f else 120f + (w.rest - 1f) * 120f,
            0.7f, 0.45f
        )
    }

    private fun uploadWallColors(w: Wall) {
        val rgb = wallColor(w)
        for (f in 0 until 6) {
            val light = CUBE_FACE_LIGHT[f]
            for (v in 0 until 4) {
                val d = (f * 4 + v) * 3
                wallColorScratch[d] = rgb[0] * light
                wallColorScratch[d + 1] = rgb[1] * light
                wallColorScratch[d + 2] = rgb[2] * light
            }
        }
        if (w.colorBuf == 0) w.colorBuf = genBuffer()
        glBindBuffer(GL_ARRAY_BUFFER, w.colorBuf)
        wallUpload.clear()
        wallUpload.put(wallColorScratch)
        wallUpload.position(0)
        glBufferData(GL_ARRAY_BUFFER, wallColorScratch.size * 4,
            wallUpload, GL_DYNAMIC_DRAW)
    }

    // ================================================================ selectie

    private fun selectAt(px: Float, py: Float) {
        val p = planePoint(px, py) ?: run { selKind = SEL_NONE; selId = -1; notifySelection(); return }
        // grijp-tolerantie schaalt mee met de zoom, zodat je ook uitvergroot nog kunt klikken
        val grab = max(0.55f, camDistance * 0.04f)

        // dichtstbijzijnde spawner
        var bestSp: Spawner? = null
        var bestSpD = Float.MAX_VALUE
        for (sp in spawners) {
            val d = sqrt((sp.x - p[0]) * (sp.x - p[0]) + (sp.y - p[1]) * (sp.y - p[1]))
            if (d < bestSpD) { bestSp = sp; bestSpD = d }
        }
        if (bestSp != null && bestSpD > max(0.9f + bestSp.size * 0.5f, grab)) bestSp = null

        // dichtstbijzijnde muur (afstand tot het lijnstuk)
        var bestW: Wall? = null
        var bestWD = Float.MAX_VALUE
        for (w in walls) {
            val dx1 = w.x1 - w.x0
            val dy1 = w.y1 - w.y0
            val len2 = dx1 * dx1 + dy1 * dy1
            var t = 0f
            if (len2 > 1e-9f) {
                t = ((p[0] - w.x0) * dx1 + (p[1] - w.y0) * dy1) / len2
                t = t.coerceIn(0f, 1f)
            }
            val d = sqrt(
                (p[0] - (w.x0 + dx1 * t)) * (p[0] - (w.x0 + dx1 * t)) +
                (p[1] - (w.y0 + dy1 * t)) * (p[1] - (w.y0 + dy1 * t))
            )
            if (d < bestWD) { bestW = w; bestWD = d }
        }
        if (bestW != null && bestWD > grab) bestW = null

        // spawner heeft voorkeur bij gelijke afstand
        if (bestSp != null && (bestW == null || bestSpD < bestWD + 0.3f)) {
            selKind = SEL_SPAWNER; selId = bestSp.id
        } else if (bestW != null) {
            selKind = SEL_WALL; selId = bestW.id
        } else {
            selKind = SEL_NONE; selId = -1
        }
        notifySelection()
    }

    // ================================================================ gebaren

    // gebaren-status (alleen UI-thread)
    private var ptrCount = 0
    // 0 geen, 1 swipe, 2 lang-indrukken-pending, 3 neutraal-slepen (de
    // camera draait niet meer rond), 4 pinch (2 vingers: pannen + zoomen),
    // 5 muur
    private var gestureKind = 0
    private var downX = 0f
    private var downY = 0f
    private var downTime = 0L
    private var lastPlaneX = 0f
    private var lastPlaneY = 0f
    private var moved = false
    private var longPlaced = false
    private var pinchDist = 1f
    private var pinchAnchor: FloatArray? = null   // vastgegrepen wereldpunt tussen de vingers
    private var lastTapMs = 0L
    private var longPressRunnable: Runnable? = null
    private val uiHandler = Handler(Looper.getMainLooper())

    private fun cancelLongPress() {
        longPressRunnable?.let { uiHandler.removeCallbacks(it) }
        longPressRunnable = null
    }

    fun handleTouch(e: MotionEvent) {
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                ptrCount = 1
                moved = false
                longPlaced = false
                downX = e.x; downY = e.y
                downTime = System.currentTimeMillis()
                when (mode) {
                    MODE_WALL -> {
                        val p = planePoint(e.x, e.y)
                        if (p != null) {
                            dragX0 = p[0]; dragY0 = p[1]
                            dragX1 = p[0]; dragY1 = p[1]
                            dragWallActive = true
                        }
                        gestureKind = 5
                    }
                    MODE_PLAY -> {
                        val p = planePoint(e.x, e.y)
                        if (p != null) { lastPlaneX = p[0]; lastPlaneY = p[1] }
                        gestureKind = 1
                    }
                    else -> {   // MODE_SPAWNER: lang indrukken = plaatsen
                        gestureKind = 2
                        val r = Runnable {
                            if (!moved) {
                                val p = planePoint(downX, downY)
                                if (p != null) {
                                    reqSpawnerX = p[0]; reqSpawnerY = p[1]
                                    requestSpawner = true
                                    longPlaced = true
                                }
                            }
                        }
                        longPressRunnable = r
                        uiHandler.postDelayed(r, 450)
                    }
                }
            }

            MotionEvent.ACTION_POINTER_DOWN -> {
                ptrCount = e.pointerCount
                cancelLongPress()
                if (gestureKind == 5) dragWallActive = false   // muur tekenen afbreken
                if (ptrCount >= 2) {
                    gestureKind = 4
                    val dx = e.getX(0) - e.getX(1)
                    val dy = e.getY(0) - e.getY(1)
                    pinchDist = maxOf(1f, sqrt(dx * dx + dy * dy))
                    val midX = (e.getX(0) + e.getX(1)) / 2f
                    val midY = (e.getY(0) + e.getY(1)) / 2f
                    // het vastgepakte wereldpunt tussen de vingers: blijft
                    // tijdens het hele gebaar tussen de vingers (pannen
                    // schuift eromheen, zoomen draait eromheen)
                    pinchAnchor = planePoint(midX, midY)
                }
            }

            MotionEvent.ACTION_MOVE -> {
                if (gestureKind == 4 && e.pointerCount >= 2) {
                    val midX = (e.getX(0) + e.getX(1)) / 2f
                    val midY = (e.getY(0) + e.getY(1)) / 2f
                    // 1) pannen: het vastgepakte wereldpunt blijft tussen de
                    //    vingers (midden schuift = camera meeschuiven,
                    //    zoals Google Maps)
                    val anchor = pinchAnchor
                    if (anchor != null) {
                        val now = planePointCam(midX, midY, camTargetX, camTargetY, camDistance)
                        if (now != null) panCam(anchor[0] - now[0], anchor[1] - now[1])
                    }
                    // 2) zoomen rond hetzelfde punt (afstand tussen de
                    //    vingers); na het pannen ligt het anker exact onder
                    //    het midden, dus zoomen houdt alles op zijn plek
                    val dx = e.getX(0) - e.getX(1)
                    val dy = e.getY(0) - e.getY(1)
                    val d = maxOf(1f, sqrt(dx * dx + dy * dy))
                    zoomAtWorld(pinchAnchor, pinchDist / d)
                    pinchDist = d
                } else if (gestureKind == 5) {
                    val p = planePoint(e.x, e.y)
                    if (p != null && dragWallActive) {
                        dragX1 = p[0]; dragY1 = p[1]
                    }
                    if (!moved && sqrt((e.x - downX) * (e.x - downX) +
                            (e.y - downY) * (e.y - downY)) > 10f) moved = true
                } else if (gestureKind == 1) {
                    val p = planePoint(e.x, e.y)
                    if (p != null) {
                        if (!moved && sqrt((e.x - downX) * (e.x - downX) +
                                (e.y - downY) * (e.y - downY)) > 10f) moved = true
                        // duw-impuls accumuleren; GL-thread verwerkt
                        swipeX = p[0]; swipeY = p[1]
                        swipeDx += p[0] - lastPlaneX
                        swipeDy += p[1] - lastPlaneY
                        swipeActive = true
                        lastPlaneX = p[0]; lastPlaneY = p[1]
                    }
                } else if (gestureKind == 2 || gestureKind == 3) {
                    // Spawner-modus: slepen breekt alleen het lang indrukken
                    // af (de camera draait niet meer rond; vaste kijkhoek)
                    if (!moved && sqrt((e.x - downX) * (e.x - downX) +
                            (e.y - downY) * (e.y - downY)) > 12f) {
                        moved = true
                        cancelLongPress()
                        gestureKind = 3
                    }
                }
            }

            MotionEvent.ACTION_POINTER_UP -> {
                ptrCount = e.pointerCount - 1
                if (gestureKind == 4 && ptrCount == 1) gestureKind = 3
            }

            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
                cancelLongPress()
                val wasGesture = gestureKind
                if (e.actionMasked == MotionEvent.ACTION_CANCEL) {
                    dragWallActive = false
                    gestureKind = 0
                    ptrCount = 0
                    return
                }
                if (wasGesture == 5) {
                    dragWallActive = false
                    val len = sqrt((dragX1 - dragX0) * (dragX1 - dragX0) +
                            (dragY1 - dragY0) * (dragY1 - dragY0))
                    if (len > 0.5f) {
                        reqWallX0 = dragX0; reqWallY0 = dragY0
                        reqWallX1 = dragX1; reqWallY1 = dragY1
                        requestWall = true
                    } else if (!moved) {
                        reqSelectX = e.x; reqSelectY = e.y
                        requestSelect = true
                    }
                } else if ((wasGesture == 1 || wasGesture == 2) && !moved && !longPlaced) {
                    // tik zonder beweging en zonder plaatsing = selecteren,
                    // hoe lang je ook inhoudt (op een telefoon is een tik vaak
                    // langer dan 300 ms en dan selecteerde hij niks)
                    val now = System.currentTimeMillis()
                    if (now - lastTapMs < 350) {
                        requestReset = true      // dubbeltik: ballen opnieuw
                        lastTapMs = 0
                    } else {
                        lastTapMs = now
                    }
                    // selecteer ALTIJD: bij een dubbeltik vallen de ballen
                    // opnieuw, maar de tik pakt daarnaast ook het object
                    reqSelectX = e.x; reqSelectY = e.y
                    requestSelect = true
                }
                gestureKind = 0
                ptrCount = 0
            }
        }
    }

    // ================================================================ tekenen

    private fun setMatrices(model: FloatArray) {
        mat4Mul(tmpM, viewM, model)
        mat4Mul(mvpM, projM, tmpM)
        glUniformMatrix4fv(uMVP, 1, false, mvpM, 0)
        glUniformMatrix4fv(uModel, 1, false, model, 0)
    }

    private fun drawSphere(model: FloatArray, colorBuf: Int) {
        glBindBuffer(GL_ARRAY_BUFFER, spherePosBuf)
        glVertexAttribPointer(aPosition, 3, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ARRAY_BUFFER, sphereNrmBuf)
        glVertexAttribPointer(aNormal, 3, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ARRAY_BUFFER, sphereABuf)
        glVertexAttribPointer(aAlpha, 1, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, sphereIdxBuf)
        setMatrices(model)
        glBindBuffer(GL_ARRAY_BUFFER, colorBuf)
        glVertexAttribPointer(aColor, 3, GL_FLOAT, false, 0, 0)
        glDrawElements(GL_TRIANGLES, sphereIdxCount, GL_UNSIGNED_SHORT, 0)
    }

    private fun drawWall(x0: Float, y0: Float, x1: Float, y1: Float, colorBuf: Int) {
        val dx = x1 - x0
        val dy = y1 - y0
        val len = sqrt(dx * dx + dy * dy)
        val ang = Math.toDegrees(atan2(dy, dx).toDouble()).toFloat()
        composeTRS(modelM, (x0 + x1) / 2f, (y0 + y1) / 2f, ang,
            maxOf(0.01f, len / 2f), WALL_HALF, WALL_DEPTH)
        glBindBuffer(GL_ARRAY_BUFFER, cubePosBuf)
        glVertexAttribPointer(aPosition, 3, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ARRAY_BUFFER, cubeNrmBuf)
        glVertexAttribPointer(aNormal, 3, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ARRAY_BUFFER, cubeABuf)
        glVertexAttribPointer(aAlpha, 1, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, cubeIdxBuf)
        setMatrices(modelM)
        glBindBuffer(GL_ARRAY_BUFFER, colorBuf)
        glVertexAttribPointer(aColor, 3, GL_FLOAT, false, 0, 0)
        glDrawElements(GL_TRIANGLES, 36, GL_UNSIGNED_SHORT, 0)
    }

    private var lastFrameNs = 0L

    /** effen kleur-upload voor kubus-modellen (pijlen e.d.) */
    private fun uploadSolidColors(buf: Int, r: Float, g: Float, b: Float) {
        val tmp = wallColorScratch
        for (f in 0 until 6) {
            val light = CUBE_FACE_LIGHT[f]
            for (v in 0 until 4) {
                val d = (f * 4 + v) * 3
                tmp[d] = r * light; tmp[d + 1] = g * light; tmp[d + 2] = b * light
            }
        }
        glBindBuffer(GL_ARRAY_BUFFER, buf)
        wallUpload.clear()
        wallUpload.put(tmp)
        wallUpload.position(0)
        glBufferData(GL_ARRAY_BUFFER, tmp.size * 4, wallUpload, GL_DYNAMIC_DRAW)
    }

    override fun onDrawFrame(gl: GL10?) {
        val nowNs = System.nanoTime()
        var dt = if (lastFrameNs == 0L) 0.016f else (nowNs - lastFrameNs) / 1e9f
        lastFrameNs = nowNs
        if (dt < 0f || dt > 0.05f) dt = 0.016f

        // ---- UI-requests verwerken (GL-thread is eigenaar van de wereld) ----
        if (requestSpawner) {
            requestSpawner = false
            val sp = addSpawner(reqSpawnerX, reqSpawnerY)
            selKind = SEL_SPAWNER; selId = sp.id
            notifySelection()
        }
        if (requestWall) {
            requestWall = false
            val w = addWall(reqWallX0, reqWallY0, reqWallX1, reqWallY1, 0.85f)
            selKind = SEL_WALL; selId = w.id
            notifySelection()
        }
        if (requestSelect) {
            requestSelect = false
            selectAt(reqSelectX, reqSelectY)
        }
        if (requestDelete) {
            requestDelete = false
            when (selKind) {
                SEL_SPAWNER -> findSpawner(selId)?.let { sp ->
                    // GL-buffers netjes vrijgeven (we zijn op de GL-thread)
                    if (sp.colorBuf != 0) glDeleteBuffers(1, intArrayOf(sp.colorBuf), 0)
                    if (sp.arrowBuf != 0) glDeleteBuffers(1, intArrayOf(sp.arrowBuf), 0)
                    synth.setSample(sp.id, null)            // sample-geheugen ook vrijgeven
                    synth.setFm(sp.id, null)                 // FM-instellingen ook vrijgeven
                    spawners.remove(sp)
                }
                SEL_WALL -> findWall(selId)?.let { w ->
                    if (w.colorBuf != 0) glDeleteBuffers(1, intArrayOf(w.colorBuf), 0)
                    walls.remove(w)
                }
            }
            selKind = SEL_NONE; selId = -1
            notifySelection()
        }
        if (requestReset) {
            requestReset = false
            resetPersistent()
        }
        if (requestScale >= 0) {
            val idx = requestScale
            requestScale = -1
            applyScale(idx)
        }
        if (requestRoot >= 0) {
            val root = requestRoot
            requestRoot = -1
            applyRoot(root)
        }
        if (pendingSampleSpId >= 0) {
            val spId = pendingSampleSpId
            val smp = pendingSample
            pendingSampleSpId = -1
            pendingSample = null
            findSpawner(spId)?.let { sp ->
                sp.sample = smp
                synth.setSample(spId, smp)
                mainHandler.post { onSampleReady?.invoke(spId, smp?.data?.size?.toFloat()?.div((smp?.sampleRate ?: 1).toFloat()) ?: 0f) }
            }
        }
        if (requestSave) {
            requestSave = false
            onWorldSaved?.invoke(serializeWorld())
        }
        if (requestLoad) {
            requestLoad = false
            val json = loadJson
            loadJson = null
            if (json != null) applyWorld(json)
        }
        if (requestClear) {
            requestClear = false
            clearWorld()
        }
        val selSp = selectedSpawner()
        if (selSp != null) {
            if (pendingInterval >= 0f) { selSp.interval = pendingInterval; pendingInterval = -1f }
            if (pendingSize >= 0f) { selSp.size = pendingSize; pendingSize = -1f }
            if (pendingAngle >= 0f) { selSp.angle = pendingAngle; pendingAngle = -1f }
            if (pendingSpeed >= 0f) { selSp.speed = pendingSpeed; pendingSpeed = -1f }
            if (pendingWave >= 0) { selSp.wave = pendingWave; pendingWave = -1 }
            if (pendingVol >= 0f) { selSp.vol = pendingVol; pendingVol = -1f }
            if (pendingWeight >= 0) { selSp.weight = pendingWeight.coerceIn(0, 100); pendingWeight = -1 }
            if (pendingVelDb > -900.0) {
                selSp.velDb = pendingVelDb.coerceIn(-24.0, 0.0)
                pendingVelDb = -999.0
            }
            // modus, FM en sample-startpunt
            if (pendingMode >= 0) { selSp.mode = pendingMode; pendingMode = -1 }
            if (pendingFmOn >= 0) {
                selSp.fmOn = pendingFmOn == 1
                pendingFmOn = -1
                pushFm(selSp)
            }
            for (k in 0 until 4) {
                if (pendingFmEn[k] >= 0) {
                    selSp.fmEn[k] = pendingFmEn[k] == 1
                    pendingFmEn[k] = -1
                    pushFm(selSp)
                }
                if (pendingFmRatio[k] >= 0f) {
                    selSp.fmRatio[k] = pendingFmRatio[k]
                    pendingFmRatio[k] = -1f
                    pushFm(selSp)
                }
                if (pendingFmIdx[k] >= 0f) {
                    selSp.fmIdx[k] = pendingFmIdx[k]
                    pendingFmIdx[k] = -1f
                    pushFm(selSp)
                }
            }
            if (pendingSampleStart >= 0f) {
                selSp.sample?.let { it.start = pendingSampleStart.coerceIn(0f, 1f) }
                pendingSampleStart = -1f
            }
            if (pendingAtk >= 0.0) { selSp.atk = pendingAtk; pendingAtk = -1.0 }
            if (pendingDcy >= 0.0) { selSp.dcy = pendingDcy; pendingDcy = -1.0 }
            if (pendingRel >= 0.0) { selSp.rel = pendingRel; pendingRel = -1.0 }
        } else {
            pendingInterval = -1f
            pendingSize = -1f
            pendingAngle = -1f
            pendingSpeed = -1f
            pendingWave = -1
            pendingVol = -1f
            pendingWeight = -1
            pendingVelDb = -999.0
            pendingMode = -1
            pendingFmOn = -1
            for (k in 0 until 4) {
                pendingFmEn[k] = -1
                pendingFmRatio[k] = -1f
                pendingFmIdx[k] = -1f
            }
            pendingSampleStart = -1f
            pendingAtk = -1.0
            pendingDcy = -1.0
            pendingRel = -1.0
        }
        val selW = selectedWall()
        if (selW != null) {
            if (pendingBounce >= 0f) {
                selW.rest = pendingBounce
                pendingBounce = -1f
                selW.dirtyColor = true
            }
        } else {
            pendingBounce = -1f
        }

        // ---- physics ----
        stepPhysics(dt)

        // ---- camera (recht van boven, haaks op het speelveld) ----
        // venster kan verkleind zijn: uitzoom blijft binnen de nieuwe maximum
        if (camDistance > maxCamDist()) camDistance = maxCamDist()
        eyeX = camTargetX + camDistance * CAM_DX
        eyeY = camTargetY + camDistance * CAM_DY
        eyeZ = CENTER_Z + camDistance * CAM_DZ
        // camera-assen (kijkt naar het zoom-mikpunt); up = (0,1,0)
        var zx = eyeX - camTargetX; var zy = eyeY - camTargetY; var zz = eyeZ - CENTER_Z
        var l = sqrt(zx * zx + zy * zy + zz * zz)
        zx /= l; zy /= l; zz /= l
        // x = up x z = (zz, 0, -zx)
        var xx = zz; var xy = 0f; var xz = -zx
        l = sqrt(xx * xx + xy * xy + xz * xz)
        xx /= l; xy /= l; xz /= l
        // y = z x x
        val yx = zy * xz - zz * xy
        val yy = zz * xx - zx * xz
        val yz = zx * xy - zy * xx
        axX[0] = xx; axX[1] = xy; axX[2] = xz
        axY[0] = yx; axY[1] = yy; axY[2] = yz
        axZ[0] = zx; axZ[1] = zy; axZ[2] = zz
        cameraReady = true   // ndcOf/panning/demping mogen de camera gebruiken
        // view-matrix (kolom-majeur)
        viewM[0] = xx; viewM[1] = xy; viewM[2] = xz; viewM[3] = 0f
        viewM[4] = yx; viewM[5] = yy; viewM[6] = yz; viewM[7] = 0f
        viewM[8] = zx; viewM[9] = zy; viewM[10] = zz; viewM[11] = 0f
        viewM[12] = -(xx * eyeX + xy * eyeY + xz * eyeZ)
        viewM[13] = -(yx * eyeX + yy * eyeY + yz * eyeZ)
        viewM[14] = -(zx * eyeX + zy * eyeY + zz * eyeZ)
        viewM[15] = 1f
        // projectie
        val aspect = surfaceW.toFloat() / surfaceH.toFloat()
        val fovF = (1.0 / tan(Math.toRadians(25.0))).toFloat()
        projM[0] = fovF / aspect; projM[1] = 0f; projM[2] = 0f; projM[3] = 0f
        projM[4] = 0f; projM[5] = fovF; projM[6] = 0f; projM[7] = 0f
        // far-plane volgt de camera: ver genoeg voor heel het veld, ook
        // volledig uitgezoomd (near 0,1 blijft)
        val far = camDistance + 2f * (fieldHalfX + fieldHalfY)
        projM[8] = 0f; projM[9] = 0f; projM[10] = (far + 0.1f) / (0.1f - far); projM[11] = -1f
        projM[12] = 0f; projM[13] = 0f; projM[14] = 2f * far * 0.1f / (0.1f - far); projM[15] = 0f

        // ---- flash-uitfading ----
        val fd = exp(-FLASH_DECAY * dt)
        for (b in balls) {
            if (!b.active || b.flash <= 0f) continue
            b.flash *= fd
            if (b.flash < 0.01f) b.flash = 0f
            uploadBallColors(b)
        }

        // ---- trail-historie: 1 punt per actieve bal per frame ----
        // (ring: oudste punt valt eruit; geen allocaties op de GL-thread)
        for (b in balls) {
            if (!b.active) continue
            if (b.trailLen == TRAIL_PTS) {
                System.arraycopy(b.trailX, 1, b.trailX, 0, TRAIL_PTS - 1)
                System.arraycopy(b.trailY, 1, b.trailY, 0, TRAIL_PTS - 1)
            } else b.trailLen++
            b.trailX[b.trailLen - 1] = b.x
            b.trailY[b.trailLen - 1] = b.y
        }

        // ---- tekenen ----
        glClearColor(0.05f, 0.06f, 0.09f, 1f)
        glClear(GL_COLOR_BUFFER_BIT or GL_DEPTH_BUFFER_BIT)
        glUniform3f(uLightDir, 0.5f, 0.8f, 0.6f)
        glUniform1f(uLit, 1f)   // muren/pijlen/achtergrond met richtingslicht
        glDisable(GL_CULL_FACE)

        // backdrop (vaste buffer +-450x+-300; schaalt mee met het veld,
        //zelfde verhouding: 1,5x de breedte, 1x de hoogte)
        composeTRS(modelM, 0f, 0f, 0f, fieldHalfX / 300f, fieldHalfY / 300f, 1f)
        glBindBuffer(GL_ARRAY_BUFFER, bdPosBuf)
        glVertexAttribPointer(aPosition, 3, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ARRAY_BUFFER, bdNrmBuf)
        glVertexAttribPointer(aNormal, 3, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ARRAY_BUFFER, bdColBuf)
        glVertexAttribPointer(aColor, 3, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ARRAY_BUFFER, bdABuf)
        glVertexAttribPointer(aAlpha, 1, GL_FLOAT, false, 0, 0)
        glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, bdIdxBuf)
        mat4Mul(tmpM, viewM, modelM)
        mat4Mul(mvpM, projM, tmpM)
        glUniformMatrix4fv(uMVP, 1, false, mvpM, 0)
        glUniformMatrix4fv(uModel, 1, false, modelM, 0)
        glDrawElements(GL_TRIANGLES, 6, GL_UNSIGNED_SHORT, 0)

        // muren (+ selectie-highlight herberekenen als de selectie wisselt)
        val selKey = if (selKind == SEL_NONE) "" else "$selKind:$selId"
        if (selKey != lastSelKey) {
            for (w in walls) w.dirtyColor = true
            lastSelKey = selKey
        }
        for (w in walls) {
            if (w.dirtyColor) {
                uploadWallColors(w)
                w.dirtyColor = false
            }
            drawWall(w.x0, w.y0, w.x1, w.y1, w.colorBuf)
        }

        // muur-voorbeeld tijdens het tekenen (lichtgrijs)
        if (dragWallActive) {
            val len = sqrt((dragX1 - dragX0) * (dragX1 - dragX0) +
                    (dragY1 - dragY0) * (dragY1 - dragY0))
            if (len > 0.05f) {
                val tmp = wallColorScratch
                val g = floatArrayOf(0.6f, 0.65f, 0.75f)
                for (f in 0 until 6) {
                    val light = CUBE_FACE_LIGHT[f]
                    for (v in 0 until 4) {
                        val d = (f * 4 + v) * 3
                        tmp[d] = g[0] * light
                        tmp[d + 1] = g[1] * light
                        tmp[d + 2] = g[2] * light
                    }
                }
                val previewBuf = genBuffer()
                glBindBuffer(GL_ARRAY_BUFFER, previewBuf)
                wallUpload.clear()
                wallUpload.put(tmp)
                wallUpload.position(0)
                glBufferData(GL_ARRAY_BUFFER, tmp.size * 4, wallUpload, GL_DYNAMIC_DRAW)
                drawWall(dragX0, dragY0, dragX1, dragY1, previewBuf)
                glDeleteBuffers(1, intArrayOf(previewBuf), 0)
            }
        }

        // richtingpijlen van spawners (platte chevrons in het speelvlak)
        for (sp in spawners) {
            val isSelA = selKind == SEL_SPAWNER && selId == sp.id
            val ac = if (isSelA) floatArrayOf(0.95f, 0.95f, 1f)
            else hslToRgb(sp.hue, 0.8f, 0.6f)
            if (sp.arrowBuf == 0) sp.arrowBuf = genBuffer()
            uploadSolidColors(sp.arrowBuf, ac[0], ac[1], ac[2])
            val a = Math.toRadians(sp.angle.toDouble())
            val dirX = Math.cos(a).toFloat()
            val dirY = Math.sin(a).toFloat()
            val tx = sp.x + dirX * 1.3f
            val ty = sp.y + dirY * 1.3f
            drawWall(sp.x, sp.y, tx, ty, sp.arrowBuf)
            val hA = a + 0.55
            val hB = a - 0.55
            drawWall(tx, ty, tx - Math.cos(hA).toFloat() * 0.6f,
                ty - Math.sin(hA).toFloat() * 0.6f, sp.arrowBuf)
            drawWall(tx, ty, tx - Math.cos(hB).toFloat() * 0.6f,
                ty - Math.sin(hB).toFloat() * 0.6f, sp.arrowBuf)
        }

        // trails: lichte, doorzichtige sleep achter de ballen, duidelijker
        // bij hogere snelheid en taps toelopend; sterkte/dikte globaal via
        // Instellingen (0 = onzichtbaar). Alle ballen samen in 1 dynamische
        // buffer = 1 draw call; herbruikbare scratch-arrays = geen allocaties.
        if (trailStrength > 0.01f) {
            var tv = 0
            for (b in balls) {
                if (!b.active || b.trailLen < 2) continue
                val sf = minOf(1f, sqrt(b.vx * b.vx + b.vy * b.vy) / 8f)
                if (sf <= 0.02f) continue
                val col = hslToRgb(b.hue, 0.85f, 0.55f)
                val n = b.trailLen
                for (j in 0 until n - 1) {
                    // historie loopt van oud naar nieuw: het nieuwere eind
                    // van segment j is punt (n-1-j)
                    val i1 = n - 1 - j
                    val i0 = i1 - 1
                    val x0 = b.trailX[i0]; val y0 = b.trailY[i0]
                    val x1 = b.trailX[i1]; val y1 = b.trailY[i1]
                    val ddx = x1 - x0; val ddy = y1 - y0
                    val l = sqrt(ddx * ddx + ddy * ddy)
                    if (l < 1e-4f) continue
                    val f1 = 1f - j.toFloat() / (n - 1).toFloat()
                    val f0 = 1f - (j + 1).toFloat() / (n - 1).toFloat()
                    val a = TRAIL_MAX_ALPHA * trailStrength * sf * f1 * f1
                    if (a <= 0.004f) continue
                    val px = -ddy / l
                    val py = ddx / l
                    val w0 = b.r * (0.05f + 0.7f * f0)
                    val w1 = b.r * (0.05f + 0.7f * f1)
                    if (tv + 6 > trailQuads * 6) break
                    var v = tv * 3
                    trailPos[v] = x0 - px * w0; trailPos[v + 1] = y0 - py * w0; trailPos[v + 2] = 0f
                    trailPos[v + 3] = x1 - px * w1; trailPos[v + 4] = y1 - py * w1; trailPos[v + 5] = 0f
                    trailPos[v + 6] = x1 + px * w1; trailPos[v + 7] = y1 + py * w1; trailPos[v + 8] = 0f
                    trailPos[v + 9] = x0 - px * w0; trailPos[v + 10] = y0 - py * w0; trailPos[v + 11] = 0f
                    trailPos[v + 12] = x1 + px * w1; trailPos[v + 13] = y1 + py * w1; trailPos[v + 14] = 0f
                    trailPos[v + 15] = x0 + px * w0; trailPos[v + 16] = y0 + py * w0; trailPos[v + 17] = 0f
                    for (k in 0 until 6) {
                        val c = v + k * 3
                        trailCol[c] = col[0]; trailCol[c + 1] = col[1]; trailCol[c + 2] = col[2]
                        trailAlp[tv + k] = a
                    }
                    tv += 6
                }
            }
            if (tv > 0) {
                glUniform1f(uLit, 0f)              // platte kleur met alpha
                glEnable(GL_BLEND)
                glBlendFunc(GL_SRC_ALPHA, GL_ONE_MINUS_SRC_ALPHA)
                glDepthMask(false)                 // trails schrijven geen diepte
                composeTRS(modelM, 0f, 0f, 0f, 1f, 1f, 1f)
                setMatrices(modelM)
                glBindBuffer(GL_ARRAY_BUFFER, trailPosBuf)
                trailPosUpload.clear(); trailPosUpload.put(trailPos); trailPosUpload.position(0)
                glBufferData(GL_ARRAY_BUFFER, trailPos.size * 4, trailPosUpload, GL_DYNAMIC_DRAW)
                glVertexAttribPointer(aPosition, 3, GL_FLOAT, false, 0, 0)
                glBindBuffer(GL_ARRAY_BUFFER, trailColBuf)
                trailColUpload.clear(); trailColUpload.put(trailCol); trailColUpload.position(0)
                glBufferData(GL_ARRAY_BUFFER, trailCol.size * 4, trailColUpload, GL_DYNAMIC_DRAW)
                glVertexAttribPointer(aColor, 3, GL_FLOAT, false, 0, 0)
                glBindBuffer(GL_ARRAY_BUFFER, trailAlpBuf)
                trailAlpUpload.clear(); trailAlpUpload.put(trailAlp); trailAlpUpload.position(0)
                glBufferData(GL_ARRAY_BUFFER, trailAlp.size * 4, trailAlpUpload, GL_DYNAMIC_DRAW)
                glVertexAttribPointer(aAlpha, 1, GL_FLOAT, false, 0, 0)
                glDrawArrays(GL_TRIANGLES, 0, tv)
                glDepthMask(true)
                glDisable(GL_BLEND)
            }
        }

        // spawner-markers (mini-schijven; geselecteerde pulseert)
        glUniform1f(uLit, 0f)   // ballen en markers zijn plat
        val tSec = nowNs / 1e9
        for (sp in spawners) {
            val isSel = selKind == SEL_SPAWNER && selId == sp.id
            val pulse = if (isSel) 0.75f + 0.25f * sin(tSec * 6.0).toFloat() else 1f
            val scale = 0.35f * if (isSel) 1.3f else 1f
            val mc = if (isSel) floatArrayOf(0.95f, 0.95f, 1f)
            else hslToRgb(sp.hue, 0.25f, 0.6f)
            for (i in 0 until sphereVertCount) {
                val d = i * 3
                ballColorScratch[d] = mc[0] * pulse
                ballColorScratch[d + 1] = mc[1] * pulse
                ballColorScratch[d + 2] = mc[2] * pulse
            }
            if (sp.colorBuf == 0) sp.colorBuf = genBuffer()
            glBindBuffer(GL_ARRAY_BUFFER, sp.colorBuf)
            ballUpload.clear()
            ballUpload.put(ballColorScratch)
            ballUpload.position(0)
            glBufferData(GL_ARRAY_BUFFER, ballColorScratch.size * 4,
                ballUpload, GL_DYNAMIC_DRAW)
            composeTRS(modelM, sp.x, sp.y, ((tSec * 40.0) % 360.0).toFloat(), scale, scale, scale)
            drawSphere(modelM, sp.colorBuf)
        }

        // ballen
        for (b in balls) {
            if (!b.active) continue
            composeTRS(modelM, b.x, b.y, b.angle, b.r, b.r, b.r)
            drawSphere(modelM, b.colorBuf)
        }
    }
}


// ============================================================================
// BESTAND: app/src/main/java/com/example/rotatingcube/MainActivity.kt
// ============================================================================

package com.example.rotatingcube

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Canvas
import android.graphics.Paint
import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder
import android.os.Build
import android.os.Bundle
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.AdapterView
import android.widget.ArrayAdapter
import android.widget.Button
import android.widget.LinearLayout
import android.widget.RadioButton
import android.widget.RadioGroup
import android.widget.SeekBar
import android.widget.ScrollView
import android.widget.Spinner
import android.widget.TextView
import android.widget.Toast
import org.json.JSONObject
import java.util.Locale
import kotlin.math.log10
import kotlin.math.pow

/**
 * Waveform van de opname van de geselecteerde spawner (sampler-modus):
 * envelope per kolom, het deel vóór het startpunt gedimd, en het
 * startpunt als witte lijn. Slepen op de view verplaatst het startpunt.
 */
class WaveformView(context: Context) : View(context) {
    /** data + sampleRate van de actuele opname (null = nog geen opname) */
    var sampleProvider: (() -> Pair<FloatArray, Int>?)? = null
    /** startpunt zoals de view hem tekent (0..1) */
    var startFrac = 0f
    /** elke keer als de gebruiker het startpunt versleept (fractie 0..1) */
    var onStartDate: ((Float) -> Unit)? = null
    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private var dragging = false

    override fun onDraw(canvas: Canvas) {
        val w = width.toFloat()
        val h = height.toFloat()
        canvas.drawColor(0xFF0D1420.toInt())
        val smp = sampleProvider?.invoke()
        if (smp == null) {
            // nog geen opname: platte lijn
            paint.color = 0xFF26324A.toInt()
            paint.strokeWidth = 2f
            canvas.drawLine(0f, h / 2f, w, h / 2f, paint)
            return
        }
        val data = smp.first
        val startX = (startFrac * w).coerceIn(0f, w)
        if (startX > 0f) {
            paint.color = 0xFF1A2236.toInt()
            canvas.drawRect(0f, 0f, startX, h, paint)   // gedimd deel vóór start
        }
        val cols = maxOf(1, width)
        for (x in 0 until cols) {
            val i0 = (x.toLong() * data.size / cols).toInt()
            val i1 = maxOf(i0 + 1, ((x + 1).toLong() * data.size / cols).toInt())
            var mn = 1f
            var mx = -1f
            for (i in i0 until minOf(i1, data.size)) {
                val v = data[i]
                if (v < mn) mn = v
                if (v > mx) mx = v
            }
            paint.color = if (x >= startX) 0xFF4F8CFF.toInt() else 0xFF3A4A6A.toInt()
            val y0 = (1f - mx) * h / 2f
            val y1 = (1f - mn) * h / 2f
            canvas.drawRect(x.toFloat(), y0, x + 1f, maxOf(y0 + 1f, y1), paint)
        }
        paint.color = 0xFFFFFFFF.toInt()
        canvas.drawRect(startX, 0f, startX + 2f, h, paint)
    }

    override fun onTouchEvent(e: MotionEvent): Boolean {
        when (e.actionMasked) {
            MotionEvent.ACTION_DOWN -> { dragging = true; applyStart(e.x); return true }
            MotionEvent.ACTION_MOVE -> if (dragging) applyStart(e.x)
            MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> dragging = false
        }
        return true
    }

    private fun applyStart(x: Float) {
        startFrac = (x / maxOf(1f, width.toFloat())).coerceIn(0f, 1f)
        onStartDate?.invoke(startFrac)
        invalidate()
    }
}

/**
 * Programmatic UI (geen XML-layouts): mode-keuze, globale synth-sliders, een
 * globale ladder-keuze en een selectiepanel dat altijd zichtbaar onderaan
 * het scherm meeverandert met wat je in de wereld aantikt.
 */
class MainActivity : Activity() {

    companion object {
        /** grondtoon-namen bij de Grondtoon-slider (0 = A ... 11 = G#) */
        val ROOT_NAMES = arrayOf("A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#")
    }

    private lateinit var renderer: BallRenderer

    private lateinit var selScroll: ScrollView
    private lateinit var selTitle: TextView
    private lateinit var rowInt: LinearLayout
    private lateinit var rowSize: LinearLayout
    private lateinit var rowAngle: LinearLayout
    private lateinit var rowSpeed: LinearLayout
    private lateinit var rowWeight: LinearLayout
    private lateinit var rowVolume: LinearLayout
    private lateinit var rowWave: LinearLayout
    private lateinit var rowAtk: LinearLayout
    private lateinit var rowDcy: LinearLayout
    private lateinit var rowRel: LinearLayout
    private lateinit var rowVel: LinearLayout
    private lateinit var rowBounce: LinearLayout
    private lateinit var recBtn: Button
    private lateinit var recStatus: TextView
    private lateinit var sInt: SeekBar
    private lateinit var sSize: SeekBar
    private lateinit var sAngle: SeekBar
    private lateinit var sSpeed: SeekBar
    private lateinit var sWeight: SeekBar
    private lateinit var sVolume: SeekBar
    private lateinit var sWave: SeekBar
    private lateinit var sBounce: SeekBar
    private lateinit var sScale: SeekBar
    private lateinit var sRoot: SeekBar
    private lateinit var sOct: SeekBar
    private lateinit var sFw: SeekBar
    private lateinit var sFh: SeekBar
    private lateinit var sVel: SeekBar
    private lateinit var sTr: SeekBar
    private lateinit var spVoices: Spinner   // stem-pool: max aantal stemmen
    private lateinit var spSteal: Spinner     // stem-pool: wie wordt er gestolen
    private lateinit var sIntV: TextView
    private lateinit var sSizeV: TextView
    private lateinit var sAngleV: TextView
    private lateinit var sSpeedV: TextView
    private lateinit var sWeightV: TextView
    private lateinit var sVolumeV: TextView
    private lateinit var sWaveV: TextView
    private lateinit var sAtk: SeekBar
    private lateinit var sDcy: SeekBar
    private lateinit var sRel: SeekBar
    private lateinit var sVelDb: SeekBar
    private lateinit var sAtkV: TextView
    private lateinit var sDcyV: TextView
    private lateinit var sRelV: TextView
    private lateinit var sVelDbV: TextView
    private lateinit var sBounceV: TextView
    private lateinit var delBtn: Button
    private var syncing = false

    // ---- modus / FM / sampler (selectiepanel) ----
    private lateinit var rowMode: LinearLayout
    private lateinit var bSynth: Button
    private lateinit var bSampler: Button
    private lateinit var fmToggle: Button
    private lateinit var fmRatioRows: Array<LinearLayout>
    private lateinit var fmIdxRows: Array<LinearLayout>
    private lateinit var waveView: WaveformView
    private lateinit var rowStart: LinearLayout
    private lateinit var sStart: SeekBar
    private lateinit var sStartV: TextView
    // UI-state die één frame vóórloopt op de GL-thread (die past de pendings
    // toe): zorgt dat knoppen en secties meteen meeschakelen
    private var uiSelSpId = -1
    private var uiMode = -1
    private var uiFmOn = -1
    private var uiFmEn = IntArray(4) { -1 }

    // ---- microfoon-opname (sampler-modus) ----
    private var recRunning = false
    private var recThread: Thread? = null
    private var recBaseFreq = 220f                 // noot van de spawner bij opnamestart

    private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        renderer = BallRenderer()
        val surface = BallSurfaceView(this, renderer)

        // ---------- panel ----------
        val scroll = ScrollView(this)
        scroll.setBackgroundColor(0xE6101521.toInt())
        val panel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(12), dp(12), dp(12), dp(12))
        }

        panel.addView(TextView(this).apply {
            text = "Ball Music Machine"
            textSize = 14f
            setTextColor(0xFF9FB0C8.toInt())
        })

        // ---- modi ----
        val modes = RadioGroup(this).apply { orientation = RadioGroup.HORIZONTAL }
        val rbPlay = RadioButton(this).apply { text = "Play"; id = View.generateViewId() }
        val rbSpawner = RadioButton(this).apply { text = "Spawner"; id = View.generateViewId() }
        val rbWall = RadioButton(this).apply { text = "Wall"; id = View.generateViewId() }
        rbPlay.isChecked = true
        modes.addView(rbPlay)
        modes.addView(rbSpawner)
        modes.addView(rbWall)
        panel.addView(modes)
        modes.setOnCheckedChangeListener { _, id ->
            renderer.mode = when (id) {
                rbSpawner.id -> BallRenderer.MODE_SPAWNER
                rbWall.id -> BallRenderer.MODE_WALL
                else -> BallRenderer.MODE_PLAY
            }
        }

        // ---- creatie opslaan / laden / canvas resetten ----
        val prefs = getSharedPreferences("bollenmachine", MODE_PRIVATE)
        renderer.onWorldSaved = { json ->
            prefs.edit().putString("world", json).apply()
        }
        val saveRow = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        fun btnParams() = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
        saveRow.addView(Button(this).apply {
            text = "Save"
            layoutParams = btnParams()
            setOnClickListener { renderer.requestSave = true }
        })
        saveRow.addView(Button(this).apply {
            text = "Load"
            layoutParams = btnParams()
            setOnClickListener {
                val json = prefs.getString("world", null)
                if (json == null) {
                    Toast.makeText(this@MainActivity, "Nothing saved yet", Toast.LENGTH_SHORT).show()
                } else {
                    // opgeslagen ladder eerst op de slider zetten (vuurt requestScale;
                    // GL verwerkt die vóór het laden, en applyWorld zet hem sowieso)
                    try {
                        val sc = JSONObject(json).optInt("scale", 0).coerceIn(0, 4)
                        syncing = true
                        sScale.progress = sc * 25
                        syncing = false
                    } catch (_: Exception) { }
                    // grondtoon idem dito
                    try {
                        val rt = JSONObject(json).optInt("root", 0).coerceIn(0, 11)
                        syncing = true
                        sRoot.progress = rt * 100 / 11
                        syncing = false
                    } catch (_: Exception) { }
                    // octaven idem dito (oudere opslag: standaard 4)
                    try {
                        val oc = JSONObject(json).optInt("oct", 4).coerceIn(2, 6)
                        syncing = true
                        sOct.progress = (oc - 2) * 25
                        syncing = false
                    } catch (_: Exception) { }
                    // veldafmetingen idem dito (oudere opslag: huidige veld;
                    // de slider past setFieldSize direct toe, applyWorld zet
                    // ze daarna sowieso op dezelfde waarden)
                    try {
                        val jo = JSONObject(json)
                        val fw = jo.optInt("fw", renderer.fieldHalfX.toInt()).coerceIn(50, 300)
                        val fh = jo.optInt("fh", renderer.fieldHalfY.toInt()).coerceIn(50, 300)
                        syncing = true
                        sFw.progress = ((fw - 50) / 2.5).toInt()
                        sFh.progress = ((fh - 50) / 2.5).toInt()
                        syncing = false
                    } catch (_: Exception) { }
                    // velocity-diepte (globale standaard) idem dito
                    try {
                        val vd = JSONObject(json).optJSONObject("synth")
                            ?.optDouble("velDb", -8.0) ?: -8.0
                        syncing = true
                        sVel.progress = Math.round(-vd.coerceIn(-24.0, 0.0) * 100.0 / 24.0).toInt()
                        syncing = false
                    } catch (_: Exception) { }
                    // trail-sterkte idem dito (oudere opslag: standaard 50%)
                    try {
                        val tr = JSONObject(json).optInt("tr", 50).coerceIn(0, 100)
                        syncing = true
                        sTr.progress = tr
                        syncing = false
                    } catch (_: Exception) { }
                    // stem-pool idem dito (oudere opslag: standaard 8 stemmen,
                    // oudste stelen); setSelection vuurt de listener, die
                    // past de waarde direct toe (zelfde als applyWorld doet)
                    try {
                        val jo = JSONObject(json)
                        val mv = jo.optInt("mv", 8).coerceIn(8, 64)
                        val ad = spVoices.adapter
                        var idx = 0
                        for (i in 0 until ad.count) {
                            if (ad.getItem(i).toString().toIntOrNull() == mv) { idx = i; break }
                        }
                        spVoices.setSelection(idx)
                        spSteal.setSelection(if (jo.optInt("sm", 0) == 1) 1 else 0)
                    } catch (_: Exception) { }
                    renderer.loadJson = json
                    renderer.requestLoad = true
                    Toast.makeText(this@MainActivity, "Creation restored", Toast.LENGTH_SHORT).show()
                }
            }
        })
        saveRow.addView(Button(this).apply {
            text = "Reset"
            layoutParams = btnParams()
            setOnClickListener {
                renderer.requestClear = true
                Toast.makeText(this@MainActivity, "Canvas cleared", Toast.LENGTH_SHORT).show()
            }
        })
        saveRow.addView(Button(this).apply {
            text = "Reset camera"
            layoutParams = btnParams()
            setOnClickListener {
                renderer.resetCam()   // mikpunt + afstand terug naar het begin
                Toast.makeText(this@MainActivity, "Camera centered", Toast.LENGTH_SHORT).show()
            }
        })
        panel.addView(saveRow)

        // ---- standaard voor nieuwe spawners ----
        panel.addView(TextView(this).apply {
            text = "Default for new spawners"
            textSize = 11f
            setTextColor(0xFF8FA6C8.toInt())
        })
        panel.addView(sliderRow("Attack", 1) { p ->
            renderer.synth.attackSec = p * 2.0 / 1000.0
            fmtTime(renderer.synth.attackSec.toFloat())
        })

        panel.addView(sliderRow("Decay", 51) { p ->
            renderer.synth.decaySec = 0.01 * pow(200.0, p / 100.0)
            fmtTime(renderer.synth.decaySec.toFloat())
        })

        panel.addView(sliderRow("Release", 61) { p ->
            renderer.synth.releaseSec = 0.01 * pow(200.0, p / 100.0)
            fmtTime(renderer.synth.releaseSec.toFloat())
        })

        // ---- globaal ----
        panel.addView(TextView(this).apply {
            text = "Global"
            textSize = 11f
            setTextColor(0xFF8FA6C8.toInt())
        })
        // velocity-diepte: standaard voor NIEUWE spawners (per spawner apart
        // in te stellen in het selectiepanel); 33 -> -8 dB
        panel.addView(sliderRow("Velocity", 33) { p ->
            renderer.synth.velocityDepthDb = -Math.round(p * 24.0 / 100.0)
            if (renderer.synth.velocityDepthDb > -0.5) "0 dB (none)"
            else Math.round(renderer.synth.velocityDepthDb).toString() + " dB (default)"
        }.also { sVel = it.getTag(0) as SeekBar })

        // ---- globale ladder (5 standaardladders, grondtoon instelbaar) ----
        panel.addView(sliderRow("Scale", 0) { p ->
            val idx = Math.round(p * 4.0 / 100.0).toInt().coerceIn(0, 4)
            if (!syncing) renderer.requestScale = idx
            BallRenderer.SCALE_NAMES[idx]
        }.also { sScale = it.getTag(0) as SeekBar })

        panel.addView(sliderRow("Root", 0) { p ->
            val semi = Math.round(p * 11.0 / 100.0).toInt().coerceIn(0, 11)
            if (!syncing) renderer.requestRoot = semi
            ROOT_NAMES[semi]
        }.also { sRoot = it.getTag(0) as SeekBar })

        // hoogte-op-Canvas: octaven over de hoogte van het HELE veld (2 t/m 6)
        panel.addView(sliderRow("Octaves", 50) { p ->
            val n = 2 + Math.round(p * 4.0 / 100.0).toInt().coerceIn(0, 4)
            if (!syncing) renderer.octaves = n
            "$n octaves"
        }.also { sOct = it.getTag(0) as SeekBar })

        // veldafmetingen: slider 0..100 -> halve breedte/hoogte 50..300
        // (20 = standaard: veld 200 x 200; 100 = het oude veld 600 x 600).
        // setFieldSize schrijft alleen @Volatile-velden (lockvrij), dus
        // ook tijdens de slider-sync bij Laden veilig direct toepassen
        panel.addView(sliderRow("Field width", 20) { p ->
            val hx = (50.0 + 2.5 * p).toFloat()
            renderer.setFieldSize(hx, renderer.fieldHalfY)
            "${Math.round(2f * renderer.fieldHalfX)} wide"
        }.also { sFw = it.getTag(0) as SeekBar })

        panel.addView(sliderRow("Field height", 20) { p ->
            val hy = (50.0 + 2.5 * p).toFloat()
            renderer.setFieldSize(renderer.fieldHalfX, hy)
            "${Math.round(2f * renderer.fieldHalfY)} tall"
        }.also { sFh = it.getTag(0) as SeekBar })

        // trail: globale sterkte/dikte van de sleep achter ballen (0 = onzichtbaar)
        panel.addView(sliderRow("Trail", 50) { p ->
            renderer.setTrailStrength(p / 100f)
            Math.round(renderer.getTrailStrength() * 100f).toString() + "%"
        }.also { sTr = it.getTag(0) as SeekBar })

        // stem-pool: maximaal aantal gelijktijdige stemmen (standaard 8, tot
        // 64) + welke stem er gestolen wordt als de pool vol zit: de oudste
        // (standaard) of degene het verst van het cameramikpunt (midden
        // van het scherm)
        val voiceOpts = arrayOf("8", "16", "24", "32", "48", "64")
        val voiceVals = intArrayOf(8, 16, 24, 32, 48, 64)
        panel.addView(spinnerRow("Voices", voiceOpts) { pos ->
            renderer.setVoicePool(voiceVals[pos])
        }.also { spVoices = it.getTag(0) as Spinner })
        panel.addView(spinnerRow("Steal", arrayOf("Oldest", "Furthest")) { pos ->
            renderer.setStealFurthest(pos == 1)
        }.also { spSteal = it.getTag(0) as Spinner })

        // ---- selectiepanel (aparte strip onderaan, altijd zichtbaar bij selectie) ----
        selScroll = ScrollView(this).apply {
            setBackgroundColor(0xE6101521.toInt())
            visibility = View.GONE
        }
        val selPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dp(12), dp(10), dp(12), dp(10))
        }

        selPanel.addView(TextView(this).apply {
            text = "Nothing selected"
            textSize = 13f
            setTextColor(0xFFCFE0FF.toInt())
        }.also { selTitle = it })

        rowInt = sliderRow("Interval") { p ->
            if (!syncing) renderer.setSelInterval(progressToInterval(p))
            fmtTime(renderer.getSelInterval())
        }
        rowInt.visibility = View.GONE
        sInt = rowInt.getTag(0) as SeekBar
        sIntV = rowInt.getTag(1) as TextView
        selPanel.addView(rowInt)

        rowSize = sliderRow("Size") { p ->
            if (!syncing) renderer.setSelSize(progressToSize(p))
            "r " + String.format(Locale.US, "%.2f", renderer.getSelSize())
        }
        rowSize.visibility = View.GONE
        sSize = rowSize.getTag(0) as SeekBar
        sSizeV = rowSize.getTag(1) as TextView
        selPanel.addView(rowSize)

        rowAngle = sliderRow("Direction") { p ->
            if (!syncing) renderer.setSelAngle(progressToAngle(p))
            Math.round(renderer.getSelAngle().toDouble()).toInt().toString() + "°"
        }
        rowAngle.visibility = View.GONE
        sAngle = rowAngle.getTag(0) as SeekBar
        sAngleV = rowAngle.getTag(1) as TextView
        selPanel.addView(rowAngle)

        rowSpeed = sliderRow("Speed") { p ->
            if (!syncing) renderer.setSelSpeed(progressToSpeed(p))
            Math.round(renderer.getSelSpeed().toDouble()).toString()
        }
        rowSpeed.visibility = View.GONE
        sSpeed = rowSpeed.getTag(0) as SeekBar
        sSpeedV = rowSpeed.getTag(1) as TextView
        selPanel.addView(rowSpeed)

        // gewicht van de spawner: x0,1..x1,9 zwaartekracht + duw-weerstand
        rowWeight = sliderRow("Weight") { p ->
            if (!syncing) renderer.setSelWeight(p)
            val w = renderer.getSelWeight()
            String.format(Locale.US, "x%.1f", 0.1 + 1.8 * w / 100.0)
        }
        rowWeight.visibility = View.GONE
        sWeight = rowWeight.getTag(0) as SeekBar
        sWeightV = rowWeight.getTag(1) as TextView
        selPanel.addView(rowWeight)

        rowVolume = sliderRow("Volume") { p ->
            if (!syncing) renderer.setSelVol(progressToVol(p))
            Math.round(renderer.getSelVol() * 100f).toString() + "%"
        }
        rowVolume.visibility = View.GONE
        sVolume = rowVolume.getTag(0) as SeekBar
        sVolumeV = rowVolume.getTag(1) as TextView
        selPanel.addView(rowVolume)

        rowWave = sliderRow("Wave") { p ->
            if (!syncing) renderer.setSelWave(progressToWave(p))
            WAVE_NAMES[renderer.getSelWave().coerceIn(0, WAVE_NAMES.size - 1)]
        }
        rowWave.visibility = View.GONE
        sWave = rowWave.getTag(0) as SeekBar
        sWaveV = rowWave.getTag(1) as TextView
        selPanel.addView(rowWave)

        // ---- ADR per spawner (attack/decay/release van deze spawner) ----
        rowAtk = sliderRow("Attack") { p ->
            if (!syncing) renderer.setSelAtk(p * 2.0 / 1000.0)
            fmtTime(renderer.getSelAtk().toFloat())
        }
        rowAtk.visibility = View.GONE
        sAtk = rowAtk.getTag(0) as SeekBar
        sAtkV = rowAtk.getTag(1) as TextView
        selPanel.addView(rowAtk)

        rowDcy = sliderRow("Decay") { p ->
            if (!syncing) renderer.setSelDcy(0.01 * pow(200.0, p / 100.0))
            fmtTime(renderer.getSelDcy().toFloat())
        }
        rowDcy.visibility = View.GONE
        sDcy = rowDcy.getTag(0) as SeekBar
        sDcyV = rowDcy.getTag(1) as TextView
        selPanel.addView(rowDcy)

        rowRel = sliderRow("Release") { p ->
            if (!syncing) renderer.setSelRel(0.01 * pow(200.0, p / 100.0))
            fmtTime(renderer.getSelRel().toFloat())
        }
        rowRel.visibility = View.GONE
        sRel = rowRel.getTag(0) as SeekBar
        sRelV = rowRel.getTag(1) as TextView
        selPanel.addView(rowRel)

        // velocity-diepte van deze spawner: -24..0 dB, standaard -8
        // (volume bij kruipende bal; volle snelheid = altijd 0 dB)
        rowVel = sliderRow("Velocity") { p ->
            if (!syncing) renderer.setSelVelDb(-Math.round(p * 24.0 / 100.0).toDouble())
            val vd = renderer.getSelVelDb()
            if (vd > -0.5) "0 dB" else Math.round(vd).toString() + " dB"
        }
        rowVel.visibility = View.GONE
        sVelDb = rowVel.getTag(0) as SeekBar
        sVelDbV = rowVel.getTag(1) as TextView
        selPanel.addView(rowVel)

        // ---- spawner-modus: Synth (golf + FM) of Sampler (opname + startpunt) ----
        rowMode = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        rowMode.addView(TextView(this).apply {
            text = "Mode"
            setTextColor(0xFF9FB0C8.toInt())
            textSize = 12f
            layoutParams = LinearLayout.LayoutParams(dp(84), ViewGroup.LayoutParams.WRAP_CONTENT)
        })
        bSynth = Button(this).apply {
            text = "Synth"
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            setOnClickListener { requestUiMode(BallRenderer.MODE_SYNTH) }
        }
        bSampler = Button(this).apply {
            text = "Sampler"
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            setOnClickListener { requestUiMode(BallRenderer.MODE_SAMPLER) }
        }
        rowMode.addView(bSynth)
        rowMode.addView(bSampler)
        rowMode.visibility = View.GONE
        selPanel.addView(rowMode)

        // ---- FM (synth-modus): aan/uit + 4 modulators ----
        fmToggle = Button(this).apply {
            text = "FM: off"
            setOnClickListener {
                val on = !(if (uiSelSpId == renderer.selId && uiFmOn >= 0) uiFmOn == 1 else renderer.getSelFmOn())
                uiSelSpId = renderer.selId
                uiFmOn = if (on) 1 else 0
                renderer.setSelFmOn(on)
                syncSelPanel()
            }
        }
        fmToggle.visibility = View.GONE
        selPanel.addView(fmToggle)
        fmRatioRows = Array(4) { LinearLayout(this) }
        fmIdxRows = Array(4) { LinearLayout(this) }
        for (k in 0 until 4) {
            fmRatioRows[k] = fmModRow(k).also { row ->
                row.visibility = View.GONE
                selPanel.addView(row)
            }
            fmIdxRows[k] = sliderRow("M${k + 1} depth") { p ->
                val v = p / 25f
                if (!syncing) renderer.setSelFmIdx(k, v)
                "idx " + String.format(Locale.US, "%.1f", v)
            }.also { row ->
                row.visibility = View.GONE
                selPanel.addView(row)
            }
        }

        rowBounce = sliderRow("Bounce") { p ->
            if (!syncing) renderer.setSelBounce(progressToBounce(p))
            "×" + String.format(Locale.US, "%.2f", renderer.getSelBounce())
        }
        rowBounce.visibility = View.GONE
        sBounce = rowBounce.getTag(0) as SeekBar
        sBounceV = rowBounce.getTag(1) as TextView
        selPanel.addView(rowBounce)

        // opnameknop: alleen zichtbaar in sampler-modus; ingedrukt houden = opnemen
        recBtn = Button(this).apply {
            text = "Hold to record"
            visibility = View.GONE
            setOnTouchListener { _, event ->
                when (event.actionMasked) {
                    MotionEvent.ACTION_DOWN -> { startRecording(); true }
                    MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> { stopRecording(); true }
                    else -> false
                }
            }
        }
        selPanel.addView(recBtn)

        recStatus = TextView(this).apply {
            textSize = 11f
            setTextColor(0xFF7488A8.toInt())
            visibility = View.GONE
        }
        selPanel.addView(recStatus)

        // waveform-visualisatie van de opname (alleen in sampler-modus)
        waveView = WaveformView(this).apply {
            sampleProvider = { renderer.getSelSample()?.let { Pair(it.data, it.sampleRate) } }
            visibility = View.GONE
            onStartDate = { frac ->
                renderer.setSelSampleStart(frac)
                syncSelPanel()
            }
        }
        selPanel.addView(waveView, LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, dp(64)))

        // startpunt-slider (fractie 0..1 van de opname), alleen in sampler-modus
        rowStart = sliderRow("Start") { p ->
            if (!syncing) renderer.setSelSampleStart(p / 100f)
            val s = renderer.getSelSample()
            if (s != null) fmtTime(renderer.getSelSampleStart() * s.data.size / s.sampleRate) + " / " + fmtTime(s.data.size.toFloat() / s.sampleRate)
            else "0 ms"
        }
        sStart = rowStart.getTag(0) as SeekBar
        sStartV = rowStart.getTag(1) as TextView
        rowStart.visibility = View.GONE
        selPanel.addView(rowStart)

        delBtn = Button(this).apply {
            text = "Delete"
            setOnClickListener { renderer.deleteSelected() }
            visibility = View.GONE
        }
        selPanel.addView(delBtn)

        selScroll.addView(selPanel)

        panel.addView(TextView(this).apply {
            text = "Tap = select/delete · double tap = re-drop balls · " +
                "Play: swipe = push, 2 fingers = camera · " +
                "Spawner: long press = place (Synth/Sampler: FM or recording + start point) · " +
                "Wall: drag = draw"
            textSize = 11f
            setTextColor(0xFF7488A8.toInt())
            setPadding(0, dp(10), 0, 0)
        })

        scroll.addView(panel)

        // selectie-callbacks (komen binnen op de main thread)
        renderer.onSelectionChanged = { _, _ -> runOnUiThread {
            uiSelSpId = -1
            uiMode = -1
            uiFmOn = -1
            uiFmEn = IntArray(4) { -1 }
            syncSelPanel()
        } }
        renderer.onSampleReady = { _, _ -> runOnUiThread { syncSelPanel() } }

        // ---------- layout ----------
        val root = android.widget.FrameLayout(this)
        root.addView(surface, android.widget.FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT))

        // inklapbaar settings-panel: toggle-knop boven, scroll eronder
        val toggleBtn = Button(this).apply {
            text = "Settings ▸"
            setOnClickListener {
                val open = scroll.visibility != View.VISIBLE
                scroll.visibility = if (open) View.VISIBLE else View.GONE
                text = if (open) "Settings ▾" else "Settings ▸"
            }
        }
        val panelWrap = LinearLayout(this).apply { orientation = LinearLayout.VERTICAL }
        panelWrap.addView(toggleBtn)
        panelWrap.addView(scroll, LinearLayout.LayoutParams(dp(320), ViewGroup.LayoutParams.MATCH_PARENT))
        scroll.visibility = View.GONE   // start ingeklapt: leeg canvas
        root.addView(panelWrap, android.widget.FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.MATCH_PARENT).apply {
            marginStart = dp(10)
            topMargin = dp(10)
        })
        // selectiepanel onderaan, over het volle scherm: altijd zichtbaar bij selectie
        root.addView(selScroll, android.widget.FrameLayout.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT,
            Gravity.BOTTOM))
        setContentView(root)
    }

    override fun onResume() {
        super.onResume()
        renderer.synth.start()
    }

    override fun onPause() {
        super.onPause()
        stopRecording()                       // opname netjes afsluiten
        renderer.synth.stop()
    }

    // ---------- microfoon-opname (sampler-modus) ----------

    /** ingedrukt houden = opnemen; de sample wordt de stem van deze spawner */
    private fun startRecording() {
        if (recRunning) return
        if (renderer.selKind != BallRenderer.SEL_SPAWNER) return
        val spId = renderer.selId
        if (Build.VERSION.SDK_INT >= 23 &&
            checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 1)
            Toast.makeText(this, "Grant microphone access and press again", Toast.LENGTH_SHORT).show()
            return
        }
        val minBuf = AudioRecord.getMinBufferSize(
            48000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
        if (minBuf <= 0) {
            Toast.makeText(this, "Microphone not available", Toast.LENGTH_SHORT).show()
            return
        }
        val rec = AudioRecord(MediaRecorder.AudioSource.MIC, 48000,
            AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, minBuf * 4)
        if (rec.state != AudioRecord.STATE_INITIALIZED) {
            rec.release()
            Toast.makeText(this, "Microphone not available", Toast.LENGTH_SHORT).show()
            return
        }
        // basistoon van de sample = de noot van de spawner op dit moment;
        // daarboven/beneden pitcht de bal hem met de ladderverhouding
        recBaseFreq = renderer.getSelPitch()
        recRunning = true
        recBtn.text = "Recording… (release)"
        recThread = Thread {
            try {
                rec.startRecording()
                val chunks = ArrayList<ShortArray>()
                var total = 0
                val cap = 5 * 48000        // max 5 seconden
                val buf = ShortArray(2048)
                while (recRunning && total < cap) {
                    val n = rec.read(buf, 0, minOf(buf.size, cap - total))
                    if (n <= 0) break
                    chunks.add(buf.copyOf(n))
                    total += n
                }
                rec.stop()
                if (total >= 64) {
                    val all = ShortArray(total)
                    var off = 0
                    for (c in chunks) { c.copyInto(all, off); off += c.size }
                    val data = FloatArray(total) { all[it] / 32768f }
                    // normaliseren: piek naar 0,95, zodat stillere opnames even luid klinken
                    var peak = 0f
                    for (v in data) { val a = Math.abs(v).toFloat(); if (a > peak) peak = a }
                    if (peak > 1e-6f) { val g = 0.95f / peak; for (i in data.indices) data[i] *= g }
                    renderer.setPendingSample(spId, SampleData(data, recBaseFreq, 48000))
                } else {
                    runOnUiThread {
                        Toast.makeText(this@MainActivity, "Too short, hold longer", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (_: Exception) {
                // opnames fouten op de achtergrond weg; de knop reset zich hieronder
            } finally {
                rec.release()
                recRunning = false
                runOnUiThread { recBtn.text = "Hold to record" }
            }
        }.also { it.start() }
    }

    private fun stopRecording() { recRunning = false }

    override fun onRequestPermissionsResult(
        requestCode: Int, permissions: Array<out String>, grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        // na toestaan drukt de gebruiker simpelweg nog een keer op de knop
    }

    // ---------- selectiepanel ----------

    private fun syncSelPanel() {
        syncing = true
        when (renderer.selKind) {
            BallRenderer.SEL_SPAWNER -> {
                selTitle.text = "Spawner ${renderer.selId}"
                selScroll.visibility = View.VISIBLE
                rowInt.visibility = View.VISIBLE
                rowSize.visibility = View.VISIBLE
                rowAngle.visibility = View.VISIBLE
                rowSpeed.visibility = View.VISIBLE
                rowWeight.visibility = View.VISIBLE
                rowVolume.visibility = View.VISIBLE
                rowWave.visibility = View.VISIBLE
                rowAtk.visibility = View.VISIBLE
                rowDcy.visibility = View.VISIBLE
                rowRel.visibility = View.VISIBLE
                rowVel.visibility = View.VISIBLE
                rowBounce.visibility = View.GONE
                sInt.progress = intervalToProgress(renderer.getSelInterval())
                sSize.progress = sizeToProgress(renderer.getSelSize())
                sAngle.progress = angleToProgress(renderer.getSelAngle())
                sSpeed.progress = speedToProgress(renderer.getSelSpeed())
                sWeight.progress = renderer.getSelWeight().coerceIn(0, 100)
                sVelDb.progress = Math.round(-renderer.getSelVelDb().coerceIn(-24.0, 0.0) * 100.0 / 24.0).toInt()
                sVolume.progress = volToProgress(renderer.getSelVol())
                sWave.progress = waveToProgress(renderer.getSelWave())
                sIntV.text = fmtTime(renderer.getSelInterval())
                sSizeV.text = "r " + String.format(Locale.US, "%.2f", renderer.getSelSize())
                sAngleV.text = Math.round(renderer.getSelAngle().toDouble()).toInt().toString() + "°"
                sSpeedV.text = Math.round(renderer.getSelSpeed().toDouble()).toString()
                sWeightV.text = String.format(Locale.US, "x%.1f", 0.1 + 1.8 * renderer.getSelWeight() / 100.0)
                val vdSel = renderer.getSelVelDb()
                sVelDbV.text = if (vdSel > -0.5) "0 dB" else Math.round(vdSel).toString() + " dB"
                sVolumeV.text = Math.round(renderer.getSelVol() * 100f).toString() + "%"
                sWaveV.text = WAVE_NAMES[renderer.getSelWave()]
                // ADR per spawner: sliders + labels syncen
                sAtk.progress = Math.round(renderer.getSelAtk() * 1000.0 / 2.0).toInt().coerceIn(0, 100)
                sDcy.progress = Math.round(100.0 * Math.log(renderer.getSelDcy() / 0.01) / Math.log(200.0)).toInt().coerceIn(0, 100)
                sRel.progress = Math.round(100.0 * Math.log(renderer.getSelRel() / 0.01) / Math.log(200.0)).toInt().coerceIn(0, 100)
                sAtkV.text = fmtTime(renderer.getSelAtk().toFloat())
                sDcyV.text = fmtTime(renderer.getSelDcy().toFloat())
                sRelV.text = fmtTime(renderer.getSelRel().toFloat())
                // ---- modus: Synth (golf + FM) of Sampler (opname + startpunt) ----
                val useUi = uiSelSpId == renderer.selId
                val mode = if (useUi && uiMode >= 0) uiMode else renderer.getSelMode()
                val fmOn = if (useUi && uiFmOn >= 0) uiFmOn == 1 else renderer.getSelFmOn()
                val isSynth = mode == BallRenderer.MODE_SYNTH
                rowMode.visibility = View.VISIBLE
                bSynth.setBackgroundColor(if (isSynth) 0xFF24406E.toInt() else 0xFF151B28.toInt())
                bSampler.setBackgroundColor(if (!isSynth) 0xFF24406E.toInt() else 0xFF151B28.toInt())
                rowWave.visibility = if (isSynth) View.VISIBLE else View.GONE
                fmToggle.visibility = if (isSynth) View.VISIBLE else View.GONE
                fmToggle.text = if (fmOn) "FM: on" else "FM: off"
                for (k in 0 until 4) {
                    val en = if (useUi && uiFmEn[k] >= 0) uiFmEn[k] == 1 else renderer.getSelFmEn(k)
                    val show = isSynth && fmOn
                    fmRatioRows[k].visibility = if (show) View.VISIBLE else View.GONE
                    fmIdxRows[k].visibility = if (show && en) View.VISIBLE else View.GONE
                    if (show) {
                        (fmRatioRows[k].getChildAt(0) as Button).text = "M${k + 1} " + if (en) "✓" else "✗"
                        val r = renderer.getSelFmRatio(k)
                        (fmRatioRows[k].getTag(0) as SeekBar).progress = fmRatioToProgress(r)
                        (fmRatioRows[k].getTag(1) as TextView).text = "×" + String.format(Locale.US, "%.2f", r)
                        if (en) {
                            (fmIdxRows[k].getTag(0) as SeekBar).progress = fmIdxToProgress(renderer.getSelFmIdx(k))
                            (fmIdxRows[k].getTag(1) as TextView).text = "idx " + String.format(Locale.US, "%.1f", renderer.getSelFmIdx(k))
                        }
                    }
                }
                val isSampler = !isSynth
                recBtn.visibility = if (isSampler) View.VISIBLE else View.GONE
                recStatus.visibility = if (isSampler) View.VISIBLE else View.GONE
                waveView.visibility = if (isSampler) View.VISIBLE else View.GONE
                rowStart.visibility = if (isSampler) View.VISIBLE else View.GONE
                if (isSampler) {
                    val smp = renderer.getSelSample()
                    val sec = renderer.getSelSampleSec()
                    recStatus.text = if (smp != null) "Sample: " + fmtTime(sec) + " · normalized"
                    else "No recording yet (falls back to synth)"
                    waveView.startFrac = renderer.getSelSampleStart()
                    waveView.invalidate()
                    sStart.progress = Math.round(renderer.getSelSampleStart() * 100f)
                    sStartV.text = if (smp != null)
                        fmtTime(renderer.getSelSampleStart() * smp.data.size / smp.sampleRate) + " / " +
                        fmtTime(smp.data.size.toFloat() / smp.sampleRate)
                    else "0 ms"
                }
                delBtn.visibility = View.VISIBLE
            }
            BallRenderer.SEL_WALL -> {
                selTitle.text = "Wall ${renderer.selId}"
                selScroll.visibility = View.VISIBLE
                rowInt.visibility = View.GONE
                rowSize.visibility = View.GONE
                rowAngle.visibility = View.GONE
                rowSpeed.visibility = View.GONE
                rowWeight.visibility = View.GONE
                rowVolume.visibility = View.GONE
                rowWave.visibility = View.GONE
                rowAtk.visibility = View.GONE
                rowDcy.visibility = View.GONE
                rowRel.visibility = View.GONE
                rowVel.visibility = View.GONE
                rowMode.visibility = View.GONE
                fmToggle.visibility = View.GONE
                for (k in 0 until 4) { fmRatioRows[k].visibility = View.GONE; fmIdxRows[k].visibility = View.GONE }
                recBtn.visibility = View.GONE
                recStatus.visibility = View.GONE
                waveView.visibility = View.GONE
                rowStart.visibility = View.GONE
                rowBounce.visibility = View.VISIBLE
                recBtn.visibility = View.GONE
                recStatus.visibility = View.GONE
                sBounce.progress = bounceToProgress(renderer.getSelBounce())
                sBounceV.text = "×" + String.format(Locale.US, "%.2f", renderer.getSelBounce())
                delBtn.visibility = View.VISIBLE
            }
            else -> {
                // niks geselecteerd: hele panel weg
                selScroll.visibility = View.GONE
            }
        }
        syncing = false
    }

    // ---------- sliders ----------

    /** label + seekbar + waarde; tag(0) = SeekBar, tag(1) = waarde-TextView.
     *  init >= 0 zet de beginstand (vuurt meteen de listener in). */
    private fun sliderRow(label: String, init: Int = -1, onChange: (Int) -> String): LinearLayout {
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val tv = TextView(this).apply {
            text = label
            setTextColor(0xFF9FB0C8.toInt())
            textSize = 12f
            layoutParams = LinearLayout.LayoutParams(dp(84), ViewGroup.LayoutParams.WRAP_CONTENT)
        }
        val sb = SeekBar(this).apply {
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            max = 100
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, p: Int, fromUser: Boolean) {
                    val out = onChange(p)
                    row.getTag(1)?.let { (it as TextView).text = out }
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })
        }
        val valTv = TextView(this).apply {
            setTextColor(0xFFCFE0FF.toInt())
            textSize = 12f
            layoutParams = LinearLayout.LayoutParams(dp(96), ViewGroup.LayoutParams.WRAP_CONTENT)
            gravity = Gravity.END
        }
        row.addView(tv)
        row.addView(sb)
        row.addView(valTv)
        row.setTag(0, sb)
        row.setTag(1, valTv)
        if (init >= 0) sb.progress = init   // vuurt de listener (tag is al gezet)
        return row
    }

    /** dropdown-rij (label + Spinner) zoals sliderRow, voor keuzes uit een
     *  vast lijstje zoals de stem-pool (Grotere pool = per stem sqrt(8/max)
     *  zachter zodat de som nooit clippt) */
    private fun spinnerRow(label: String, options: Array<String>, onPick: (Int) -> Unit): LinearLayout {
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        row.addView(TextView(this).apply {
            text = label
            setTextColor(0xFF9FB0C8.toInt())
            textSize = 12f
            layoutParams = LinearLayout.LayoutParams(dp(84), ViewGroup.LayoutParams.WRAP_CONTENT)
        })
        val sp = Spinner(this).apply {
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            adapter = ArrayAdapter(this@MainActivity, android.R.layout.simple_spinner_item, options)
            onItemSelectedListener = object : AdapterView.OnItemSelectedListener {
                override fun onItemSelected(parent: AdapterView<*>?, v: View?, pos: Int, id: Long) {
                    onPick(pos)
                }
                override fun onNothingSelected(parent: AdapterView<*>?) {}
            }
        }
        row.addView(sp)
        row.setTag(0, sp)
        return row
    }

    // ---------- mapping sliders <-> waarden ----------

    private val WAVE_NAMES = arrayOf("Sine", "Square", "Saw", "Triangle")

    private fun progressToInterval(p: Int) = (0.25 * pow(20.0, p / 100.0)).toFloat()
    private fun intervalToProgress(v: Float) =
        (100.0 * log10(v / 0.25f) / log10(20.0)).toInt().coerceIn(0, 100)

    private fun progressToSize(p: Int) = 0.3f + 0.9f * p / 100f
    private fun sizeToProgress(v: Float) = ((v - 0.3f) / 0.9f * 100f).toInt().coerceIn(0, 100)

    // Bounce: 0..100 -> 0.05..2.0 (boven 1.0 versnelt de muur de bal)
    private fun progressToBounce(p: Int) = 0.05f + 1.95f * p / 100f
    private fun bounceToProgress(v: Float) = ((v - 0.05f) / 1.95f * 100f).toInt().coerceIn(0, 100)

    // Richting: 0..100 → 0..360 graden (0 = rechts, 90 = omhoog, 270 = omlaag)
    private fun progressToAngle(p: Int) = p * 3.6f
    private fun angleToProgress(a: Float) = (a / 3.6f).toInt().coerceIn(0, 100)

    // Snelheid: 0..100 → 0..100 (lineair 1:1), afvuursnelheid van de spawner
    private fun progressToSpeed(p: Int) = p.toFloat()
    private fun speedToProgress(s: Float) = s.toInt().coerceIn(0, 100)

    // Volume: 0..100 → 0..1, volume van de ballen van deze spawner
    private fun progressToVol(p: Int) = p / 100f
    private fun volToProgress(v: Float) = (v * 100f).toInt().coerceIn(0, 100)

    // Golf: 0..100 → preset 0..4 (Sinus / Blok / Zaag / Driehoek / Sample)
    private fun progressToWave(p: Int): Int = Math.round(p * 3.0 / 100.0).toInt()
    private fun waveToProgress(w: Int): Int = (w * 100 / 3).coerceIn(0, 100)

    // ---- FM-mappings: ratio 0.25..8 logaritmisch, index 0..4 lineair ----
    private fun progressToFmRatio(p: Int): Float = (0.25 * Math.pow(32.0, p / 100.0)).toFloat()
    private fun fmRatioToProgress(r: Float): Int = Math.round(100.0 * Math.log((r / 0.25).toDouble()) / Math.log(32.0)).coerceIn(0, 100)
    private fun fmIdxToProgress(i: Float): Int = Math.round(i * 25f).coerceIn(0, 100)

    /** modus-knop: verandering meteen doorvoeren en paneel verversen */
    private fun requestUiMode(m: Int) {
        if (renderer.selId < 0) return
        uiSelSpId = renderer.selId
        uiMode = m
        renderer.setSelMode(m)
        syncSelPanel()
    }

    /** FM-rij voor modulator k: M-knop (aan/uit) + ratio-slider ("×r") */
    private fun fmModRow(k: Int): LinearLayout {
        val row = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        val btn = Button(this).apply {
            text = "M${k + 1} ✗"
            setOnClickListener {
                val en = !(if (uiSelSpId == renderer.selId && uiFmEn[k] >= 0) uiFmEn[k] == 1 else renderer.getSelFmEn(k))
                uiSelSpId = renderer.selId
                uiFmEn[k] = if (en) 1 else 0
                renderer.setSelFmEn(k, en)
                syncSelPanel()
            }
        }
        row.addView(btn, LinearLayout.LayoutParams(dp(72), ViewGroup.LayoutParams.WRAP_CONTENT))
        val sb = SeekBar(this).apply {
            layoutParams = LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f)
            max = 100
            setOnSeekBarChangeListener(object : SeekBar.OnSeekBarChangeListener {
                override fun onProgressChanged(seekBar: SeekBar?, p: Int, fromUser: Boolean) {
                    val v = progressToFmRatio(p)
                    if (!syncing) renderer.setSelFmRatio(k, v)
                    row.getTag(1)?.let { (it as TextView).text = "×" + String.format(Locale.US, "%.2f", v) }
                }
                override fun onStartTrackingTouch(seekBar: SeekBar?) {}
                override fun onStopTrackingTouch(seekBar: SeekBar?) {}
            })
        }
        row.addView(sb)
        row.addView(TextView(this).apply {
            setTextColor(0xFFCFE0FF.toInt())
            textSize = 12f
            layoutParams = LinearLayout.LayoutParams(dp(60), ViewGroup.LayoutParams.WRAP_CONTENT)
        })
        row.setTag(0, sb)
        row.setTag(1, row.getChildAt(2))
        return row
    }

    private fun fmtTime(sec: Float): String =
        if (sec < 1f) "${(sec * 1000).toInt()} ms"
        else String.format(Locale.US, "%.2f s", sec)
}


// ============================================================================
// BESTAND: app/build.gradle.kts  (optioneel: de wizard van Android Studio
// genereert ook een werkende versie; er zijn geen extra dependencies nodig)
// ============================================================================

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.example.rotatingcube"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.example.rotatingcube"
        minSdk = 21
        targetSdk = 35
        versionCode = 1
        versionName = "2.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}
