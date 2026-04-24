import type { MentalityQuestionDefinition } from "../mentality-types";

export const seriousLongtermMentalityQuestions: MentalityQuestionDefinition[] = [
  {
    id: "serious_openness",
    branch: "serious_longterm",
    questionKey: "serious.answers.openness",
    kind: "single_select",
    label: "Longterm",
    title: "When you meet someone new lately, which state feels most like you?",
    description:
      "This helps us understand your current openness to starting something new.",
    options: [
      {
        value: "very_open",
        title: "Very open to starting",
        copy: "If it feels right, you're happy to talk and see where it goes.",
      },
      {
        value: "selective_open",
        title: "Open, but very selective",
        copy: "You only want to invest in a small number of people who really stand out.",
      },
      {
        value: "go_with_the_flow",
        title: "Pretty go with the flow",
        copy: "You're open, but not actively pushing anything forward.",
      },
      {
        value: "low_capacity",
        title: "Low capacity right now",
        copy: "You do not have much energy to start something at the moment.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.openness),
  },
  {
    id: "serious_attraction_threshold",
    branch: "serious_longterm",
    questionKey: "serious.answers.attractionThreshold",
    kind: "single_select",
    label: "Longterm",
    title: "If the first impression is not especially striking, but the conversation feels easy, would you keep going?",
    description: "This helps us understand how much weight you place on first-look attraction.",
    options: [
      {
        value: "yes_connection_matters_more",
        title: "Yes, chemistry in conversation matters more",
        copy: "How it feels to talk matters more than a dazzling first impression.",
      },
      {
        value: "maybe_if_very_smooth",
        title: "Maybe, if the conversation is really smooth",
        copy: "You can grow into attraction if the interaction feels unusually strong.",
      },
      {
        value: "no_base_attraction_matters",
        title: "Probably not, baseline attraction still matters",
        copy: "You need a solid first spark to want to continue.",
      },
      {
        value: "depends_on_person",
        title: "Hard to say, it depends on the person",
        copy: "You do not think there is one fixed rule here.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.attractionThreshold),
  },
  {
    id: "serious_starting_style",
    branch: "serious_longterm",
    questionKey: "serious.answers.startingStyle",
    kind: "single_select",
    label: "Longterm",
    title: "When you first meet someone you're a little interested in, what starting pace feels best?",
    description: "This captures how quickly you like early momentum to build.",
    options: [
      {
        value: "fast_back_and_forth",
        title: "A quick back-and-forth right away",
        copy: "You like early energy and responsiveness.",
      },
      {
        value: "warm_up_gradually",
        title: "Start light, then warm up gradually",
        copy: "You prefer a softer ramp into real interest.",
      },
      {
        value: "observe_before_investing",
        title: "Watch first before investing",
        copy: "You want to see whether the person is worth your energy.",
      },
      {
        value: "respond_to_initiative",
        title: "I get more engaged when they lead a bit",
        copy: "You open up more when the other person brings some initiative.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.startingStyle),
  },
  {
    id: "serious_chat_frequency",
    branch: "serious_longterm",
    questionKey: "serious.answers.chatFrequency",
    kind: "single_select",
    label: "Longterm",
    title: "Ideally, how often would you like to talk with someone you're interested in?",
    description: "This helps us understand your communication rhythm in the early stage.",
    options: [
      {
        value: "many_times_a_day",
        title: "Many times a day",
        copy: "Frequent contact helps you feel connected.",
      },
      {
        value: "a_little_every_day",
        title: "A little every day",
        copy: "Consistency matters more than intensity.",
      },
      {
        value: "every_few_days_is_fine",
        title: "Every few days is fine",
        copy: "You do not need constant contact to stay interested.",
      },
      {
        value: "no_fixed_expectation",
        title: "No fixed expectation, let it flow naturally",
        copy: "You prefer not to force a pattern too early.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.chatFrequency),
  },
  {
    id: "serious_initiative_style",
    branch: "serious_longterm",
    questionKey: "serious.answers.initiativeStyle",
    kind: "single_select",
    label: "Longterm",
    title: "In a new connection, which one usually sounds most like you?",
    description: "This maps your natural level of initiative at the start.",
    options: [
      {
        value: "drives_the_conversation",
        title: "I usually drive the conversation",
        copy: "You naturally create momentum and keep things moving.",
      },
      {
        value: "responsive_but_not_starter",
        title: "I respond well, but do not always start",
        copy: "You engage strongly without always initiating first.",
      },
      {
        value: "slow_then_active",
        title: "I start slow, then become more proactive",
        copy: "Your energy grows once comfort is established.",
      },
      {
        value: "depends_on_person_and_feeling",
        title: "It fully depends on the person and the vibe",
        copy: "Your style changes a lot depending on the match.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.initiativeStyle),
  },
  {
    id: "serious_turnoff",
    branch: "serious_longterm",
    questionKey: "serious.answers.turnoff",
    kind: "single_select",
    label: "Longterm",
    title: "Which situation is most likely to make you suddenly lose interest?",
    description: "This surfaces your strongest red flag during the talking stage.",
    options: [
      {
        value: "dry_conversation",
        title: "Dry conversation that goes nowhere",
        copy: "You lose interest when the exchange has no spark or depth.",
      },
      {
        value: "cold_or_dismissive",
        title: "Cold energy that feels dismissive",
        copy: "You shut down when the other person feels detached or half-present.",
      },
      {
        value: "too_much_too_fast",
        title: "Too intense, too fast",
        copy: "You pull back when the pace feels forced.",
      },
      {
        value: "self_centered",
        title: "They only talk about themselves",
        copy: "You need real reciprocity to stay engaged.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.turnoff),
  },
  {
    id: "serious_response_need",
    branch: "serious_longterm",
    questionKey: "serious.answers.responseNeed",
    kind: "single_select",
    label: "Longterm",
    title: "What kind of response style do you need most?",
    description: "This points to the kind of emotional feedback that helps you feel secure.",
    options: [
      {
        value: "clear_interest",
        title: "They clearly express interest",
        copy: "Directness helps you relax into the connection.",
      },
      {
        value: "emotionally_attuned",
        title: "They know how to hold my emotions well",
        copy: "You value being emotionally received and understood.",
      },
      {
        value: "proactive_and_progressing",
        title: "They help move the conversation forward",
        copy: "Initiative and momentum matter more than reassurance.",
      },
      {
        value: "natural_is_enough",
        title: "I do not need much, natural flow is enough",
        copy: "You do not rely on heavy confirmation to stay comfortable.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.responseNeed),
  },
  {
    id: "serious_meeting_pace",
    branch: "serious_longterm",
    questionKey: "serious.answers.meetingPace",
    kind: "single_select",
    label: "Longterm",
    title: "If the conversation is going well, what pace for meeting feels best?",
    description: "This tells us how quickly you like online interest to become real-world contact.",
    options: [
      {
        value: "meet_quickly",
        title: "Meet fairly quickly",
        copy: "You prefer to test chemistry in person sooner rather than later.",
      },
      {
        value: "get_to_know_online_first",
        title: "Get more comfortable online first",
        copy: "A bit more buildup helps you feel better about meeting.",
      },
      {
        value: "need_certainty_and_safety",
        title: "I need solid certainty and safety first",
        copy: "You want more trust before moving offline.",
      },
      {
        value: "no_rush",
        title: "No rush, slow is fine",
        copy: "You are comfortable letting things unfold gradually.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.meetingPace),
  },
  {
    id: "serious_risk_tolerance",
    branch: "serious_longterm",
    questionKey: "serious.answers.riskTolerance",
    kind: "single_select",
    label: "Longterm",
    title: "In dating, which attitude toward risk feels closest to you?",
    description: "This measures how carefully you protect your time and emotional investment.",
    options: [
      {
        value: "try_more_and_learn",
        title: "I'll try more and learn as I go",
        copy: "You are willing to experiment and adjust later.",
      },
      {
        value: "try_with_guard_up",
        title: "I'll try, but I keep some guard up",
        copy: "You are open, but measured.",
      },
      {
        value: "cautious_with_investment",
        title: "I am cautious and do not invest easily",
        copy: "You need stronger evidence before committing energy.",
      },
      {
        value: "afraid_of_wrong_investment",
        title: "I really fear investing in the wrong person",
        copy: "Protecting yourself from the wrong match is a major priority.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.riskTolerance),
  },
  {
    id: "serious_connection_preference",
    branch: "serious_longterm",
    questionKey: "serious.answers.connectionPreference",
    kind: "single_select",
    label: "Longterm",
    title: "If you could choose only one, what kind of beginning do you want most?",
    description: "This captures the emotional core you most want at the start of a relationship.",
    options: [
      {
        value: "strong_spark",
        title: "A strong spark",
        copy: "Intensity and immediate pull matter most.",
      },
      {
        value: "steady_comfort",
        title: "Steady comfort",
        copy: "You want it to feel calm, secure, and easy.",
      },
      {
        value: "mutual_understanding",
        title: "Mutual understanding",
        copy: "Feeling deeply understood matters most.",
      },
      {
        value: "fun_and_light",
        title: "Fun and lightness",
        copy: "You want the early stage to feel enjoyable and easy to enter.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.connectionPreference),
  },
  {
    id: "serious_closeness_balance",
    branch: "serious_longterm",
    questionKey: "serious.answers.closenessBalance",
    kind: "single_select",
    label: "Longterm",
    title: "What does your ideal relationship feel more like?",
    description: "This helps us place you on the closeness versus independence spectrum.",
    options: [
      {
        value: "highly_involved",
        title: "Very intertwined in each other's lives",
        copy: "You want closeness, shared time, and active involvement.",
      },
      {
        value: "close_with_space",
        title: "Close, but with personal space",
        copy: "You want intimacy without losing individuality.",
      },
      {
        value: "independent_but_present",
        title: "Mostly independent, but very present when it matters",
        copy: "You prefer autonomy with strong reliability.",
      },
      {
        value: "depends_on_stage",
        title: "It depends on the stage, I do not want one fixed model",
        copy: "You want the relationship structure to stay flexible over time.",
      },
    ],
    isComplete: (draft) => Boolean(draft.serious.answers.closenessBalance),
  },
];
