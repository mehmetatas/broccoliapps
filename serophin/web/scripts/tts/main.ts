import { execSync } from "node:child_process";
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const voices = [
  { id: "nU9yuJ40F7AjihoOeWoq", suffix: "bm" }, // British Male 2
  // { id: "MISTtlh6S7ydrG1ACD7i", suffix: "af" },
] as const;

const elevenlabs = new ElevenLabsClient(); // apiKey read from ELEVENLABS_API_KEY env var defined in bash_profile

const OUTPUT_DIR = join(import.meta.dirname, "../../static/audio/meditation");

const scripts = {
  opening: [
    "Find aaa... comfortable position. You can sit or lie down... whatever feels right.",
    "Gently close your eyes... or soften your gaze downward.".replace("soften", "soooften"),
    "[sighs] Take a moment to arrive... There's nowhere else you need to be right now.",
    "Let your shoulders drop... Unclench your jaw... Relax your hands."
      .replace("shoulders", "shoooulders")
      .replace("drop", "droooop")
      .replace("jaw", "jaaaw")
      .replace("Relax", "Relaaax"),
    "Notice the weight of your body... against the surface beneath you.",
    "[sighs] There's nothing to fix or figure out... Just be here.",
    "Let any tension you're carrying... begin to soften on its own.".replace("soften", "soooften"),
    "Feel the stillness... of the room around you.".replace("stillness", "stiiillness"),
  ],
  deepbreathing: [
    "[exhales] Take a slow, deep breath in through your nose... and... out through your mouth.".replace("deep ", "deeep "),
    "[exhales] Again. Breathe in slowly... filling your lungs... and exhale, letting everything go.".replace(" slowly", " sloooowly"),
    "[exhales] One more. A full breath in... hold gently at the top... and release.".replace("release", "releeeease"),
    "Let your breathing settle... into its own natural rhythm.".replace("settle", "seeeettle"),
  ],
  bodyscan: [
    "[sighs] Now let's move our attention slowly through the body... like a gentle spotlight.".replace(" slowly", " sloooowly"),
    "As we move through the body... just notice what's there. If something softens on its own... let it. If it doesn't... that's fine too."
      .replace("notice", "nooootice")
      .replace("soften", "soooften"),
    "Bring your attention down to your feet. Notice any sensation there — warmth... tingling... or nothing at all."
      .replace("feet", "feeeeet")
      .replace("warmth", "waaarmth"),
    "Now move up through your ankles and shins... into your knees.",
    "Feel your thighs. These large muscles that carry you through the day... Let them be heavy.".replace("heavy", "heaavy"),
    "If you notice tension, you don't need to fix it... Just acknowledge it gently.".replace("notice", "nooootice"),
    "If you find tension... just breathe alongside it. Let it be there... without needing to change it.",
    "Now shift your attention to your hips... and lower back.",
    "Feel your belly rise and fall... with each breath.".replace("belly", "beeeelly"),
    "This area often holds stress... we're not even aware of.",
    "Move your attention up into your chest. Feel the gentle rise and fall... as you breathe.".replace("chest", "cheeest"),
    "Your upper back, your shoulder blades. Notice how they feel... against the surface.",
    "If the mind has wandered, gently return... to the body.",
    "Feel the space around your heart. Open... and unguarded.".replace("heart", "heaaart"),
    "Now notice your shoulders. Let them drop... away from your ears."
      .replace("notice", "nooootice")
      .replace("shoulders", "shoooulders")
      .replace("drop", "droooop"),
    "Move down through your arms... your hands... your fingertips.",
    "Let your hands be completely open and relaxed.",
    "Bring your attention to your neck and throat... Just notice what's there.".replace("notice", "nooootice"),
    "Your jaw — let it go slack. Your forehead... smooth out any creases.".replace("jaw", "jaaaw").replace("forehead", "fooooorehead"),
    "Feel your whole face becoming soft... and expressionless.".replace("soft", "soooft"),
    "The very crown of your head. Feel your entire head becoming light and quiet.",
    "Now expand your awareness to your entire body... at once.".replace("awareness", "awaaareness"),
    "Feel yourself as one whole — from the crown of your head to the tips of your toes.",
    "Your body breathing. Alive... Resting.".replace("Alive", "Aliiive").replace("Resting", "Reeesting"),
    "Completely held... Completely safe.".replace(" held", " heeeld").replace("safe", "saaafe"),
  ],
  breathfocus: [
    "[sighs] Now, bring your attention gently to your breathing.",
    "Don't try to change it... just notice it... Where do you feel the breath most?".replace("notice", "nooootice"),
    "Maybe your nostrils, your chest, or your belly... Just observe.".replace("chest", "cheeest").replace("belly", "beeeelly"),
    "Breathing in... and breathing out.".replace("Breathing", "Breeeathing"),
    "If your mind wanders, that's completely normal. Gently return... to the breath.",
    "Each breath is a small anchor, bringing you back... to this moment.".replace("anchor", "aaanchor"),
    "There's no right way to breathe. Whatever rhythm your body chooses... is perfect.".replace("perfect", "peeeerfect"),
    "[exhales] Now let's slow the breath slightly. Breathe in for a count of four.",
    "Hold gently at the top... and exhale slowly for a count of six.".replace(" slowly", " sloooowly"),
    "Again. In... two, three, four. And out... two, three, four, five, six.",
    "Continue this rhythm on your own.",
    "With each exhale, feel yourself settling... a little deeper.".replace("settle", "seeeettle").replace("deeper", "deeeper"),
    "Let the counting fall away if it feels natural. Just keep the slow... steady pace.",
    "Notice how the body softens when the exhale is longer... than the inhale.".replace("soften", "soooften"),
    "Your breath is like a wave. Rising... and falling. Let each wave carry tension away.".replace("Rising", "Riiising").replace("falling", "faaalling"),
    "There's nothing to hold on to. Just let the breath... move through you.",
    "Feel the stillness between each breath... becoming more spacious.".replace("stillness", "stiiillness").replace("spacious", "spaaacious"),
    "[sighs] Now let your breathing return to its natural rhythm... Simply sit with the breath.",
    "No technique, no counting... Just awareness.".replace("awareness", "awaaareness"),
    "If the mind has wandered, notice where it went... and come back.".replace("notice", "nooootice"),
    "See if you can hold your attention gently, like holding something fragile.",
    "Let each breath remind you: this moment... is enough.".replace("enough", "enooough"),
    "Notice any sounds around you without following them. Then return... to the breath.",
    "Feel the aliveness in your body. The subtle hum... of being here.",
    "Stay with this open awareness. Breathing. Being.".replace("awareness", "awaaareness").replace("Breathing", "Breeeathing").replace("Being.", "Beeeing."),
  ],
  visualization: [
    "[sighs] As you rest in this stillness... now let your mind drift to a place that feels calm to you."
      .replace("stillness", "stiiillness")
      .replace("calm", "caaaalm"),
    "It might be somewhere you've been, or simply a place that feels safe... and familiar.".replace("safe", "saaafe"),
    "A beach. A park. A room you love. A quiet trail. Wherever you felt at ease.",
    "Take a moment to let that place come to mind. Don't force it... let it arrive.",
    "It might be somewhere recent, or from years ago. Either is fine.",
    "Whether it's a memory or just a feeling, let it come to you... naturally.",
    "[sighs] You're there now. Don't worry about getting every detail right. Just let the feeling of it... return.",
    "What's the first thing you notice? The colour of the sky... The shape of the space.".replace("notice", "nooootice"),
    "Let the scene fill in at its own pace... There's no hurry.",
    "Notice what time of day it feels like... The quality of light.",
    "You're not watching this place like a movie... You're in it.",
    "Look around slowly. Take in the shapes, the colours, the textures.".replace(" slowly", " sloooowly"),
    "Notice something small... a detail you'd normally overlook.",
    "Let your eyes move slowly. No need to take everything in at once.".replace(" slowly", " sloooowly"),
    "Now shift your attention to sound. What can you hear in this place?",
    "If the mind has wandered, gently return to your calm place.".replace("calm", "caaaalm"),
    "Let the sounds come to you... You don't have to search for them.",
    "There might be a rhythm to what you hear. Or maybe... it's deeply still.",
    "Notice what you can physically feel. The temperature on your skin... What's beneath you.",
    "Let your body respond to this place. Your shoulders might drop... Your breathing might slow."
      .replace("shoulders", "shoooulders")
      .replace("drop", "droooop"),
    "That's your body recognising safety... Let it happen.".replace("safe", "saaafe"),
    "Is there a scent in this place? Salt air. Pine. Fresh rain. Old books.",
    "You might not find a specific scent — that's fine. Just notice the air itself.".replace("notice", "nooootice"),
    "Smell is the sense most connected to memory. Let it pull you... deeper in.".replace("deeper", "deeeper"),
    "[sighs] You've built this place back around you, sense by sense... Now just be in it.",
    "Let the scene hold you the way it did... when you were really there.",
    "There's nothing to do here. Nowhere to go... No one needs anything from you.".replace("Nowhere", "Noooowhere"),
    "If details fade in and out, that's fine... Stay with the feeling.",
    "This calm isn't something you're making up. You felt it once... You're feeling it again.".replace("calm", "caaaalm"),
    "Your body remembers this place even when your mind... forgets.".replace("remembers", "remeeembers"),
    "Stay here. Rest in it. This is your place.".replace("Rest ", "Reeeest "),
    "Continue resting in this place. Let it nourish you.",
    "Things might get simpler. Quieter... Just a feeling more than a picture.",
    "Whether it's vivid or just a quiet feeling, let it be whatever it wants to be... right now.",
    "You might notice you're breathing very slowly now. That's your body at peace.".replace("notice", "nooootice").replace(" slowly", " sloooowly"),
    "In a moment, we'll begin to leave this place... But not abruptly.",
    "Take one last look around. One last breath... of this air.",
    "Know that you can come back here any time. Eyes closed... a few breaths... and you're here.",
    "Let the scene begin to soften... But keep the feeling. You can take that... with you.".replace("soften", "soooften"),
  ],
  closing: [
    "[exhales] Now begin to gently deepen your breath.".replace("deepen", "deeepen"),
    "[exhales] Take a full, slow breath in... and a long breath out.",
    "Start to bring some gentle movement back. Wiggle your fingers... and toes.",
    "Maybe roll your wrists and ankles. Stretch... if your body is asking for it.",
    "Notice how you feel... compared to when you started.",
    "Whatever you're feeling right now, take it with you. There's no need... to rush back.",
    "When you're ready... gently open your eyes.",
    "Take one more conscious breath before you move on... with your day.",
    "Thank you... for giving yourself this time.",
  ],
};

const generate = async (text: string, voiceId: string, outputPath: string) => {
  const audioStream = await elevenlabs.textToSpeech.convert(voiceId, {
    text,
    modelId: "eleven_v3",
    outputFormat: "mp3_44100_192",
    voiceSettings: {
      // speed: 0.8,
      stability: 0.5,
    },
  });

  const chunks: Uint8Array[] = [];
  for await (const chunk of audioStream) {
    chunks.push(chunk);
  }
  const buffer = Buffer.concat(chunks);

  const tempMp3 = join(tmpdir(), `tts-${Date.now()}.mp3`);
  try {
    writeFileSync(tempMp3, buffer);
    execSync(`ffmpeg -y -i "${tempMp3}" -c:a aac -b:a 192k "${outputPath}"`, { stdio: "pipe" });
  } finally {
    try {
      unlinkSync(tempMp3);
    } catch {
      // ignore cleanup errors
    }
  }
};

if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true });
}

const entries = Object.entries(scripts);
let total = 0;
for (const [, lines] of entries) {
  total += lines.length * voices.length;
}

let done = 0;
for (const [section, lines] of entries) {
  for (let i = 0; i < lines.length; i++) {
    const num = String(i + 1).padStart(2, "0");
    for (const voice of voices) {
      const filename = `${section}_${num}_${voice.suffix}.m4a`;
      const outputPath = join(OUTPUT_DIR, filename);

      // if (existsSync(outputPath)) {
      //   done++;
      //   console.log(`[${done}/${total}] Skipping ${filename} (already exists)`);
      //   continue;
      // }

      done++;
      console.log(`[${done}/${total}] Generating ${filename}...`);
      const processed = `[gently] [slowly] ${lines[i]!} [short pause]`;
      await generate(processed, voice.id, outputPath);
    }
  }
}

console.log("All done!");
