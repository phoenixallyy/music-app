import fs from 'fs';
import path from 'path';

/**
 * Generates a valid 16-bit mono 44.1kHz PCM WAV buffer with musical frequencies.
 * Produces smooth ambient electronic soundscapes so playback works out-of-the-box.
 */
export function generateSyntheticWav(trackType: 'ambient' | 'synth' | 'chill', durationSeconds = 18): Buffer {
  const sampleRate = 44100;
  const numSamples = sampleRate * durationSeconds;
  const blockAlign = 2; // 1 channel * 2 bytes/sample
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(1, 22);  // NumChannels (1 = Mono)
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // BitsPerSample

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Harmonic chord progressions (frequencies in Hz)
  const chords: Record<string, number[][]> = {
    ambient: [
      [220.00, 261.63, 329.63, 392.00], // A minor 7
      [174.61, 220.00, 261.63, 329.63], // F maj 7
      [196.00, 246.94, 293.66, 392.00], // G maj
      [164.81, 196.00, 246.94, 329.63], // E min 7
    ],
    synth: [
      [130.81, 196.00, 246.94, 311.13], // C minor / Eb
      [116.54, 174.61, 233.08, 293.66], // Bb
      [103.83, 155.56, 207.65, 261.63], // Ab
      [116.54, 174.61, 233.08, 293.66], // Bb
    ],
    chill: [
      [261.63, 329.63, 392.00, 493.88], // C maj 7
      [220.00, 261.63, 329.63, 392.00], // A min 7
      [174.61, 220.00, 261.63, 329.63], // F maj 7
      [196.00, 246.94, 293.66, 349.23], // G 7
    ]
  };

  const progression = chords[trackType] || chords.ambient;
  const chordDuration = durationSeconds / progression.length;

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(Math.floor(t / chordDuration), progression.length - 1);
    const freqs = progression[chordIndex];

    // Envelope for each chord (soft attack and decay)
    const chordTime = t % chordDuration;
    const env = Math.min(chordTime * 2, 1) * Math.min((chordDuration - chordTime) * 2, 1);

    // Multi-voice harmonic synthesis
    let sample = 0;
    for (let f = 0; f < freqs.length; f++) {
      const freq = freqs[f];
      // Fundamental + subtle warm overtone + chorus detune
      const wave = Math.sin(2 * Math.PI * freq * t) * 0.6 +
                   Math.sin(2 * Math.PI * freq * 2.01 * t) * 0.2 +
                   Math.sin(2 * Math.PI * (freq * 0.995) * t) * 0.2;
      sample += wave / freqs.length;
    }

    // Add rhythmic pulse
    const lfo = 0.8 + 0.2 * Math.sin(2 * Math.PI * 1.5 * t);
    sample = sample * env * lfo;

    // Master volume scaling and soft-clipping
    const amplitude = 24000;
    const intSample = Math.max(-32767, Math.min(32767, Math.round(sample * amplitude)));
    buffer.writeInt16LE(intSample, offset);
    offset += 2;
  }

  return buffer;
}

export function ensureSeedAudioFiles(audioDir: string) {
  try {
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
  } catch {
    // Read-only filesystem (e.g. AWS Lambda / Vercel Serverless)
    return;
  }

  const seedFiles = [
    { name: 'obsidian_echoes.wav', type: 'ambient' as const, duration: 24 },
    { name: 'neon_horizon.wav', type: 'synth' as const, duration: 24 },
    { name: 'midnight_reverie.wav', type: 'chill' as const, duration: 24 },
  ];

  for (const item of seedFiles) {
    const filePath = path.join(audioDir, item.name);
    try {
      if (!fs.existsSync(filePath)) {
        const wavBuffer = generateSyntheticWav(item.type, item.duration);
        fs.writeFileSync(filePath, wavBuffer);
      }
    } catch {
      // Read-only filesystem
    }
  }
}
