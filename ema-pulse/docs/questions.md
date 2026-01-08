# EMA Pulse: Question Bank

## Categories

### **Mood/Affect (Core)**
The emotional heartbeat of every check-in. Captures how the user feels right now—not their day overall, not their expectation for later. This is the primary outcome variable that everything else correlates against. When the AI says "you feel better when X," mood is the "better."

#### Mood/Affect Questions

**M1: How are you feeling right now?**

Format: Five-Point Scale

Options:
- Awful
- Not great
- Okay
- Good
- Great

*Primary question. Pure valence—bad to good. Fastest possible input, universally understood. This is the anchor question for the category.*

---

**M2: How would you describe your mood?**

Format: Single-Select

Options:
- Low or down
- Anxious or tense
- Frustrated or irritated
- Calm or neutral
- Content or happy
- Energized or excited

*Categorical alternative to M1. Distinguishes between types of negative (sad vs. anxious vs. angry) and types of positive (calm vs. energized). Useful when the AI needs to spot patterns like "your stress shows up as irritation, not anxiety."*

---

**M3: Are you experiencing any difficult emotions right now?**

Format: Binary

Options:
- Yes
- No

*Lightweight check for emotional distress. Useful as a conditional trigger—if "Yes," the weekly synthesis can note frequency without requiring the user to label or elaborate in the moment.*



### **Activity (Core)**

What the user is actually doing in the moment. The most actionable category—activities are things people can change. Enables insights like "deep work correlates with higher energy than meetings" or "you always feel drained after errands."

#### Activity Questions

**A1: What are you doing right now?**

Format: Single-Select

Options:
- Working
- Commuting
- Eating
- Exercising
- Socializing
- Relaxing
- Chores or errands
- Other

*Primary question. Personalized during onboarding—users can swap categories to match their life. Limited to 8 options max to keep selection fast. This is the anchor question for the category.*

---

**A2: What type of work are you doing?**

Format: Single-Select

Options:
- Deep focus work
- Meetings or calls
- Email or messages
- Administrative tasks
- Creative work
- Learning or reading

*Conditional follow-up when A1 = Working. Not all work is equal—this lets the AI distinguish "meetings drain you" from "deep work energizes you." Only shown to users who frequently select Working.*

---

**A3: Are you doing something you chose to do or had to do?**

Format: Binary

Options:
- Chose to do
- Had to do

*Captures autonomy. The same activity feels different when chosen vs. obligated. Enables insights like "errands drain you when mandatory but not when self-initiated."*

### **Social Context (Core)**

Who's around. One of the strongest mood predictors in EMA research, but people are often blind to it. Surfaces patterns like "alone on weekday evenings = low mood" or "time with colleagues is more stressful than you realize."

#### Social Context Questions

**S1: Who are you with right now?**

Format: Single-Select

Options:
- Alone
- Partner
- Family
- Friends
- Colleagues
- Strangers or public

*Primary question. Simple presence check—who is physically around. This is the anchor question for the category.*

---

**S2: How much are you interacting with others right now?**

Format: Five-Point Scale

Options:
- Not at all
- A little
- Somewhat
- A lot
- Constantly

*Presence and interaction are different. You can be surrounded by colleagues but heads-down solo, or alone but texting constantly. This captures engagement level, not just proximity.*

---

**S3: Did you initiate this social situation?**

Format: Binary

Options:
- Yes
- No

*Captures social autonomy. Chosen solitude feels different than isolation. Invited dinner feels different than obligatory family gathering. Enables insights like "social time energizes you—but only when you chose it."*

### **Energy (rotating)**
Physical and mental fuel level. Distinct from mood—someone can feel happy but depleted, or grumpy but energized. Helps the AI distinguish burnout patterns from emotional patterns.

#### Energy Questions

**E1: How is your energy level right now?**

Format: Five-Point Scale

Options:
- Depleted
- Low
- Moderate
- High
- Full

*Primary question. Raw fuel gauge—not asking why, just how much is in the tank. This is the anchor question for the category.*

---

**E2: Compared to usual for this time of day, your energy is...**

Format: Five-Point Scale

Options:
- Much lower
- Somewhat lower
- About normal
- Somewhat higher
- Much higher

*Relative measure. Some people run low-energy by default and that's fine for them. This catches deviations from personal baseline rather than judging absolute level.*

---

**E3: Do you feel physically tired right now?**

Format: Binary

Options:
- Yes
- No

*Separates physical fatigue from mental fatigue. You can be mentally sharp but body exhausted, or physically fine but cognitively fried. Helps the AI distinguish sleep debt from cognitive overload.*

### **Stress (rotating)**
Felt pressure or tension right now. Tracks differently than mood—some people thrive under stress, others collapse. Useful for spotting chronic stress that users have normalized.

### Stress Questions

**ST1: How stressed do you feel right now?**

Format: Five-Point Scale

Options:
- Not at all
- Slightly
- Moderately
- Very
- Extremely

*Primary question. Direct measure of felt pressure in the moment. This is the anchor question for the category.*

---

**ST2: How manageable does your current situation feel?**

Format: Five-Point Scale

Options:
- Completely overwhelming
- Difficult to manage
- Manageable
- Comfortable
- Easy

*Inverse framing. Some people underreport stress but will admit something feels hard to manage. Also captures the demand-vs-capacity relationship—stress isn't just about pressure, it's about whether you can handle it.*

---

**ST3: Are you feeling any physical tension right now?**

Format: Binary

Options:
- Yes
- No

*Body-based stress check. Tight shoulders, clenched jaw, shallow breathing—the body often knows before the mind admits it. Catches stress people have normalized or aren't consciously registering.*

### **Meaning (rotating)**
Whether this moment feels purposeful or like going through the motions. Captures something mood misses: you can feel "fine" while spending weeks on autopilot.

#### Meaning Questions

**ME1: How meaningful does what you're doing feel right now?**

Format: Five-Point Scale

Options:
- Not at all
- Slightly
- Moderately
- Very
- Extremely

*Primary question. Direct measure of felt purpose in the moment. This is the anchor question for the category.*

---

**ME2: Right now, are you doing something that matters to you?**

Format: Binary

Options:
- Yes
- No

*Simpler framing. Some people overthink "meaningful"—this cuts through to personal significance. Also useful for quick pattern detection: what percentage of check-ins catch them doing something that matters?*

---

**ME3: How present do you feel in what you're doing?**

Format: Five-Point Scale

Options:
- Completely checked out
- Mostly distracted
- Partly engaged
- Mostly present
- Fully absorbed

*Engagement proxy. Going through the motions shows up as low presence even when the task itself could be meaningful. Catches autopilot mode—physically there, mentally elsewhere.*

### **Focus (rotating)**
Mental clarity and attention. Scattered vs. locked in. Helps identify when and where users do their best thinking, and what fragments their attention.

#### Focus Questions

**F1: How focused do you feel right now?**

Format: Five-Point Scale

Options:
- Not at all
- Slightly
- Moderately
- Very
- Extremely

*Primary question. Direct measure of attentional state in the moment. This is the anchor question for the category.*

---

**F2: How scattered is your attention right now?**

Format: Five-Point Scale

Options:
- Completely scattered
- Mostly scattered
- Somewhat scattered
- Mostly clear
- Completely clear

*Inverse framing. Some people won't claim they're focused but will admit they're scattered. Catches fragmentation that users might not register as a focus problem.*

---

**F3: Are you having trouble concentrating right now?**

Format: Binary

Options:
- Yes
- No

*Simple presence check for concentration difficulty. Useful for frequency tracking—how often do check-ins catch you struggling to concentrate? Patterns by time, activity, or social context become visible over weeks.*

### **Physical Comfort (rotating)**
Body state—pain, tension, temperature, general physical ease. Often ignored until it's bad, but subtly affects everything else.

#### Physical Comfort Questions

**PC1: How comfortable does your body feel right now?**

Format: Five-Point Scale

Options:
- Very uncomfortable
- Uncomfortable
- Neutral
- Comfortable
- Very comfortable

*Primary question. General body state without diagnosing specifics. This is the anchor question for the category.*

---

**PC2: Is anything physically bothering you right now?**

Format: Binary

Options:
- Yes
- No

*Simple presence check for discomfort. Catches low-grade issues people push through—tight back, mild headache, too cold. Frequency patterns reveal chronic issues users have normalized.*

---

**PC3: How well are your basic physical needs met right now?**

Format: Five-Point Scale

Options:
- Not at all
- Slightly
- Moderately
- Mostly
- Completely

*Covers hunger, thirst, temperature, need to move or rest. Unmet basic needs drag down everything else but people often push through without noticing. Surfaces patterns like "you're always hungry during afternoon check-ins."*

### **Presence (rotating)**
How "here" vs. mentally elsewhere. Catches rumination, anticipatory anxiety, or just chronic distraction that mood alone won't surface.

#### Presence Questions

**PR1: How present do you feel right now?**

Format: Five-Point Scale

Options:
- Not at all
- Slightly
- Moderately
- Very
- Completely

*Primary question. Direct measure of mental "here-ness" in the moment. This is the anchor question for the category.*

---

**PR2: Where is your mind right now?**

Format: Single-Select

Options:
- Stuck in the past
- Worried about the future
- Somewhere else entirely
- Drifting in and out
- Right here

*Directional measure. Distinguishes rumination (past) from anxiety (future) from general distraction (elsewhere). Helps the AI spot patterns like "your mind drifts to the future during evening check-ins."*

---

**PR3: Are you mentally somewhere other than where you are physically?**

Format: Binary

Options:
- Yes
- No

*Simple disconnect check. Catches the gap between body location and mental location. Frequency tracking reveals how often users are checked out—even during activities they think they're engaged in.*

### **Control (rotating)**
Sense of agency vs. overwhelm. Feeling out of control often precedes mood drops—this can be an early warning signal the AI learns to flag.

#### Control Questions

**C1: How in control do you feel right now?**

Format: Five-Point Scale

Options:
- Not at all
- Slightly
- Moderately
- Very
- Completely

*Primary question. Direct measure of felt agency in the moment. This is the anchor question for the category.*

---

**C2: How well can you handle what's on your plate right now?**

Format: Five-Point Scale

Options:
- Can't handle it
- Struggling
- Managing
- Handling it well
- On top of it

*Capacity framing. Some people won't say they feel "out of control" but will admit they're struggling. Captures demand-vs-ability rather than abstract agency.*

---

**C3: Do you feel like things are happening to you rather than by you?**

Format: Binary

Options:
- Yes
- No

*Passive-vs-active check. Catches reactive mode—when life feels like something you're enduring rather than directing. Frequency patterns can flag loss of agency before it shows up in mood.*

### **Rest (rotating)**
How rested vs. exhausted. Distinct from energy—you can be wired but under-rested. Tracks sleep debt and recovery patterns over time.

#### Rest Questions

**R1: How rested do you feel right now?**

Format: Five-Point Scale

Options:
- Exhausted
- Tired
- Somewhat rested
- Rested
- Fully rested

*Primary question. Direct measure of recovery state. This is the anchor question for the category.*

---

**R2: How many hours did you sleep last night?**

Format: Single-Select

Options:
- 5 or less
- About 6
- About 7
- About 8
- 9 or more

*Objective input. Pairs with felt restedness to reveal sleep quality issues—if someone slept 8 hours but feels exhausted, that's a different pattern than 5 hours and tired. Best asked at morning check-ins.*

---

**R3: Does your body need rest right now?**

Format: Binary

Options:
- Yes
- No

*Body signal check. Distinct from feeling tired—you can push through tiredness while your body is screaming for recovery. Catches the need people override. Frequency reveals chronic rest deficit.*

### **Motivation (rotating)**
Drive to do what's in front of them. Low motivation + high meaning = friction worth exploring. Low motivation + low meaning = disengagement signal.

#### Motivation Questions

**MO1: How motivated do you feel right now?**

Format: Five-Point Scale

Options:
- Not at all
- Slightly
- Moderately
- Very
- Extremely

*Primary question. Direct measure of drive in the moment. This is the anchor question for the category.*

---

**MO2: How much do you want to do what you're currently doing?**

Format: Five-Point Scale

Options:
- Not at all
- A little
- Somewhat
- Quite a bit
- Very much

*Task-specific framing. General motivation can be high while specific task motivation is low. Catches misalignment between what you're doing and what you want to be doing.*

---

**MO3: Are you having to push yourself to keep going right now?**

Format: Binary

Options:
- Yes
- No

*Effort check. Motivation isn't just about wanting—it's about the friction to act. Frequency patterns reveal how often willpower is doing the work instead of genuine drive.*

### **Mental Clarity (rotating)**
Foggy vs. sharp thinking. Complements focus—you can be focused on something while still thinking through mud. Useful for tracking cognitive load.

### Mental Clarity Questions

**MC1: How clear is your thinking right now?**

Format: Five-Point Scale

Options:
- Very foggy
- Foggy
- Neutral
- Clear
- Very clear

*Primary question. Direct measure of cognitive sharpness in the moment. This is the anchor question for the category.*

---

**MC2: How easily are your thoughts coming together right now?**

Format: Five-Point Scale

Options:
- Not at all
- With difficulty
- With some effort
- Fairly easily
- Effortlessly

*Process framing. Clarity isn't just about the output—it's how hard the mental work feels. Catches cognitive strain even when you're producing results.*

---

**MC3: Does your mind feel foggy or slow right now?**

Format: Binary

Options:
- Yes
- No

*Simple fog check. Catches brain fog people push through—dehydration, poor sleep, afternoon slump, cognitive overload. Frequency patterns reveal when and where sharp thinking happens vs. doesn't.*
