document.addEventListener("DOMContentLoaded", () => {
  const finderSection = document.querySelector(".program-finder-section");
  const stepHost = document.querySelector("[data-quiz-step]");
  const progressLabel = document.querySelector("[data-quiz-progress-label]");
  const progressBar = document.querySelector("[data-quiz-progress-bar]");
  const backButton = document.querySelector("[data-quiz-back]");
  const restartButton = document.querySelector("[data-quiz-restart]");

  if (!finderSection || !stepHost || !progressLabel || !progressBar || !backButton || !restartButton) {
    return;
  }

  const AI_SYSTEM_PROMPT = `You are helping a dog training company explain a program recommendation to a dog owner in clear, friendly language.

You are given:
- program: one of PUPPY_PACKAGE, TRANSFORMATION, or ACADEMY (this is already chosen, do not change it)
- dog_age: puppy, adolescent, or adult
- main_issue: the owner's main frustration
- time_lifestyle: how much time they realistically have to train
- urgency: annoyance, stressful, or urgent
- environment: description of their home (optional)
- has_single_session_option: true or false

Your job is ONLY to explain why this chosen program is a good fit based on these details.

Requirements:
- Write 2-3 short sentences, maximum 70 words total.
- Use plain, conversational language.
- When program = PUPPY_PACKAGE, focus on building foundations, solving puppy issues, and giving the owner clear, simple homework between sessions.
- When program = TRANSFORMATION, emphasize structured coaching over multiple sessions, clear progression, and helping the owner develop leadership and consistency at home.
- When program = ACADEMY, emphasize that professional trainers handle the heavy lifting, faster progress, and time saved for the owner, especially with busy schedules or serious issues.
- If has_single_session_option is true, add one short extra sentence at the end:
  "If you'd rather start smaller, a Single Private Session can also be used as a focused tune-up on this one behavior."
- Do NOT suggest or mention any other programs.
- Do NOT mention Premium Puppy Placement.
- Do NOT talk about pricing or discounts.
- Do NOT say that you "chose" the program-just explain why it fits.`;

  const SINGLE_SESSION_EXPLANATION = "If you'd rather start smaller, a Single Private Session can also be used as a focused tune-up on this one behavior.";

  const QUIZ_QUESTIONS = [
    {
      id: "dog_age",
      label: "How old is your dog?",
      options: [
        { value: "puppy", label: "Puppy (under 6 months)" },
        { value: "adolescent", label: "Adolescent (6-18 months)" },
        { value: "adult", label: "Adult (18+ months)" }
      ]
    },
    {
      id: "main_issue",
      label: "What's the main thing you want help with?",
      multiSelect: true,
      options: [
        { value: "pulling_not_listening", label: "Pulling on leash / not listening" },
        { value: "barking_reactivity", label: "Barking or reactivity around people/dogs" },
        { value: "aggression_safety", label: "Aggression or safety concerns" },
        { value: "puppy_issues", label: "Puppy issues (biting, potty, crate, chewing)" },
        { value: "general_manners", label: "General manners and better structure at home" }
      ]
    },
    {
      id: "time_lifestyle",
      label: "How much time do you realistically have to train each week?",
      options: [
        { value: "high_involvement", label: "I can commit to daily practice and want to be very involved in the process." },
        { value: "trainer_heavy_lifting", label: "I can practice a few times a week, but I'd like a trainer to do the heavy lifting and show me how to maintain it." },
        { value: "packed_schedule", label: "My schedule is packed or I have a trip coming up and I'd love training that can happen while my dog is already away." }
      ]
    },
    {
      id: "environment",
      label: "Which best describes your home environment?",
      options: [
        { value: "busy_family", label: "Busy family or kids in the home" },
        { value: "apartment", label: "Apartment or close neighbors" },
        { value: "yard", label: "House with a yard" },
        { value: "multi_dog", label: "Multi-dog household" }
      ]
    },
    {
      id: "urgency",
      label: "How urgent does this feel right now?",
      options: [
        { value: "annoyance", label: "It's more of an annoyance than an emergency" },
        { value: "stressful", label: "It's getting stressful and we need real change" },
        { value: "urgent", label: "It feels urgent and we're worried about safety or big problems later" }
      ]
    }
  ];

  const PROGRAM_DETAILS = {
    PUPPY_PACKAGE: {
      name: "3-4 Session Puppy Training Package",
      anchor: "/training#puppy-package-card",
      bullets: [
        "Weekly coaching with clear puppy homework between sessions",
        "Best for potty training, crate work, biting, chewing, and early manners",
        "Keeps you moving with a simple plan instead of guessing at home",
        "Can be done online from anywhere for strong puppy foundations"
      ]
    },
    TRANSFORMATION: {
      name: "Transformation Training Package",
      anchor: "/training#transformation-program-card",
      bullets: [
        "Structured coaching over multiple sessions with clear progression",
        "Hands-on support for manners, leash work, reactivity, and leadership at home",
        "Homework and follow-up guidance so progress keeps building between visits",
        "Built for owners who want real change and can stay involved in the process"
      ]
    },
    ACADEMY: {
      name: "Crowned K9s Academy Board & Train",
      anchor: "/training#academy-program-card",
      bullets: [
        "Professional trainers handle the daily reps and heavy lifting for you",
        "Strong fit for busy schedules, travel, or more serious behavior concerns",
        "Creates faster momentum with immersive structure and repetition",
        "Includes owner handoff guidance so results carry over at home"
      ]
    },
    SINGLE_SESSION: {
      name: "Single Private Session",
      anchor: "/training#pricing"
    }
  };

  const state = {
    currentStep: 0,
    answers: {}
  };

  let activeResultRequest = 0;

  backButton.addEventListener("click", () => {
    if (state.currentStep > 0) {
      state.currentStep -= 1;
      render();
    }
  });

  restartButton.addEventListener("click", () => {
    state.currentStep = 0;
    state.answers = {};
    render();
    finderSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  render();

  function render() {
    const showingResult = state.currentStep >= QUIZ_QUESTIONS.length;
    const progressValue = showingResult
      ? 100
      : ((state.currentStep + 1) / QUIZ_QUESTIONS.length) * 100;

    progressLabel.textContent = showingResult
      ? "Your recommended program"
      : `Question ${state.currentStep + 1} of ${QUIZ_QUESTIONS.length}`;
    progressBar.style.width = `${progressValue}%`;

    backButton.hidden = state.currentStep === 0;
    restartButton.hidden = !showingResult;

    if (showingResult) {
      renderResult();
      return;
    }

    const question = QUIZ_QUESTIONS[state.currentStep];
    const selectedAnswer = question.multiSelect
      ? getSelectedValues(question.id)
      : state.answers[question.id]?.value;
    const helperText = question.multiSelect
      ? "Select all that apply. Then click Continue."
      : "Choose the answer that feels closest to your real day-to-day life.";

    stepHost.innerHTML = `
      <div class="program-finder-question">
        <p class="program-finder-step-label">Question ${state.currentStep + 1}</p>
        <h3>${question.label}</h3>
        <p class="program-finder-step-helper">${helperText}</p>
        <div class="program-finder-options" role="list"></div>
        ${question.multiSelect ? '<div class="program-finder-question-actions"><button type="button" class="button cta-button program-finder-continue" disabled>Continue</button></div>' : ""}
      </div>
    `;

    const optionsHost = stepHost.querySelector(".program-finder-options");

    question.options.forEach((option) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "program-finder-option";
      if (
        (Array.isArray(selectedAnswer) && selectedAnswer.includes(option.value)) ||
        selectedAnswer === option.value
      ) {
        button.classList.add("is-selected");
      }
      button.textContent = option.label;
      button.addEventListener("click", () => {
        if (question.multiSelect) {
          toggleMultiSelectAnswer(question.id, option);
          render();
          return;
        }

        state.answers[question.id] = option;
        state.currentStep += 1;
        render();
      });
      optionsHost.appendChild(button);
    });

    if (question.multiSelect) {
      const continueButton = stepHost.querySelector(".program-finder-continue");
      const selectedOptions = getSelectedOptions(question.id);

      continueButton.disabled = selectedOptions.length === 0;
      continueButton.addEventListener("click", () => {
        if (!getSelectedOptions(question.id).length) {
          return;
        }

        state.currentStep += 1;
        render();
      });
    }
  }

  function renderResult() {
    const recommendation = determineRecommendation(state.answers);
    const primaryProgram = PROGRAM_DETAILS[recommendation.primaryProgram];
    const secondaryProgram = recommendation.secondaryPrograms.length
      ? PROGRAM_DETAILS[recommendation.secondaryPrograms[0]]
      : null;
    const context = buildQuizContext(recommendation);
    const resultRequestId = ++activeResultRequest;

    stepHost.innerHTML = `
      <article class="program-result-card">
        <p class="program-result-label">Recommended Program:</p>
        <h3>${primaryProgram.name}</h3>
        <p class="program-result-explanation is-loading" data-program-explanation>Building your explanation...</p>
        <ul class="program-result-bullets">
          ${primaryProgram.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}
        </ul>
        <div class="program-result-actions">
          <a href="https://calendly.com/crownedk9s/consultation" target="_blank" rel="noreferrer" class="cta-button">Schedule Your Consultation</a>
          <a href="${primaryProgram.anchor}" class="button button-secondary program-result-link">See Program Details</a>
        </div>
        ${renderSecondaryCopy(recommendation.primaryProgram, secondaryProgram)}
      </article>
    `;

    const explanationNode = stepHost.querySelector("[data-program-explanation]");
    getProgramExplanation(context).then((explanation) => {
      if (resultRequestId !== activeResultRequest || !explanationNode) {
        return;
      }

      explanationNode.classList.remove("is-loading");
      explanationNode.textContent = explanation;
    });
  }

  function determineRecommendation(answers) {
    const dogAge = answers.dog_age?.value;
    const mainIssue = getEffectiveMainIssue(answers.main_issue);
    const timeLifestyle = answers.time_lifestyle?.value;
    const urgency = answers.urgency?.value;
    const wantsTrainerHeavyLifting =
      timeLifestyle === "trainer_heavy_lifting" || timeLifestyle === "packed_schedule";
    const hasSingleSessionOption =
      urgency === "annoyance" &&
      timeLifestyle === "high_involvement" &&
      mainIssue !== "aggression_safety";

    let primaryProgram = "TRANSFORMATION";
    let secondaryPrograms = [];

    if (dogAge === "puppy") {
      primaryProgram = "PUPPY_PACKAGE";

      if (urgency === "urgent" && wantsTrainerHeavyLifting) {
        secondaryPrograms = ["ACADEMY"];
      } else {
        secondaryPrograms = ["TRANSFORMATION"];
      }

      return {
        primaryProgram,
        secondaryPrograms,
        hasSingleSessionOption: false
      };
    }

    if (urgency === "urgent" || mainIssue === "aggression_safety") {
      if (wantsTrainerHeavyLifting) {
        primaryProgram = "ACADEMY";
        secondaryPrograms = ["TRANSFORMATION"];
      } else {
        primaryProgram = "TRANSFORMATION";
        secondaryPrograms = ["ACADEMY"];
      }

      return {
        primaryProgram,
        secondaryPrograms,
        hasSingleSessionOption: false
      };
    }

    if (urgency === "stressful") {
      primaryProgram = "TRANSFORMATION";

      if (wantsTrainerHeavyLifting) {
        secondaryPrograms = ["ACADEMY"];
      }

      return {
        primaryProgram,
        secondaryPrograms,
        hasSingleSessionOption: false
      };
    }

    primaryProgram = "TRANSFORMATION";

    if (hasSingleSessionOption) {
      secondaryPrograms = ["SINGLE_SESSION"];
    }

    return {
      primaryProgram,
      secondaryPrograms,
      hasSingleSessionOption
    };
  }

  function buildQuizContext(recommendation) {
    return {
      program: recommendation.primaryProgram,
      dog_age: state.answers.dog_age.value,
      main_issue: getMainIssueText(state.answers.main_issue),
      time_lifestyle: state.answers.time_lifestyle.label,
      urgency: state.answers.urgency.value,
      environment: state.answers.environment?.label,
      has_single_session_option: recommendation.hasSingleSessionOption
    };
  }

  function getSelectedOptions(questionId) {
    const answer = state.answers[questionId];
    return Array.isArray(answer) ? answer : answer ? [answer] : [];
  }

  function getSelectedValues(questionId) {
    return getSelectedOptions(questionId).map((option) => option.value);
  }

  function toggleMultiSelectAnswer(questionId, option) {
    const selectedOptions = getSelectedOptions(questionId);
    const alreadySelected = selectedOptions.some((selected) => selected.value === option.value);

    if (alreadySelected) {
      state.answers[questionId] = selectedOptions.filter((selected) => selected.value !== option.value);
      return;
    }

    state.answers[questionId] = [...selectedOptions, option];
  }

  function getEffectiveMainIssue(mainIssueAnswer) {
    const selectedIssues = Array.isArray(mainIssueAnswer)
      ? mainIssueAnswer
      : mainIssueAnswer
        ? [mainIssueAnswer]
        : [];

    if (selectedIssues.some((issue) => issue.value === "aggression_safety")) {
      return "aggression_safety";
    }

    if (selectedIssues.some((issue) => issue.value === "barking_reactivity")) {
      return "barking_reactivity";
    }

    if (selectedIssues.length) {
      return selectedIssues[0].value;
    }

    return "general_manners";
  }

  function getMainIssueText(mainIssueAnswer) {
    const selectedIssues = Array.isArray(mainIssueAnswer)
      ? mainIssueAnswer
      : mainIssueAnswer
        ? [mainIssueAnswer]
        : [];

    return selectedIssues.map((issue) => issue.label).join(", ");
  }

  async function getProgramExplanation(context) {
    const endpoint =
      finderSection.getAttribute("data-ai-endpoint") ||
      window.CROWNED_K9S_PROGRAM_AI_ENDPOINT ||
      "";

    if (!endpoint) {
      return buildFallbackExplanation(context);
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          systemPrompt: AI_SYSTEM_PROMPT,
          context
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`AI request failed: ${response.status}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      const explanation = normalizeExplanation(data, context);
      return explanation || buildFallbackExplanation(context);
    } catch (error) {
      return buildFallbackExplanation(context);
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  function normalizeExplanation(data, context) {
    let explanation = "";

    if (typeof data === "string") {
      explanation = data;
    } else if (data && typeof data.explanation === "string") {
      explanation = data.explanation;
    } else if (data && typeof data.output_text === "string") {
      explanation = data.output_text;
    } else if (
      data &&
      Array.isArray(data.choices) &&
      data.choices[0] &&
      data.choices[0].message &&
      typeof data.choices[0].message.content === "string"
    ) {
      explanation = data.choices[0].message.content;
    } else if (
      data &&
      Array.isArray(data.content) &&
      data.content[0] &&
      typeof data.content[0].text === "string"
    ) {
      explanation = data.content[0].text;
    }

    explanation = explanation.replace(/\s+/g, " ").trim();

    if (!explanation) {
      return "";
    }

    if (/premium puppy placement|pricing|discount|\$\d|i chose|i selected/i.test(explanation)) {
      return "";
    }

    if (context.has_single_session_option && !explanation.includes(SINGLE_SESSION_EXPLANATION)) {
      explanation = `${explanation} ${SINGLE_SESSION_EXPLANATION}`.trim();
    }

    return explanation;
  }

  function buildFallbackExplanation(context) {
    let explanation = "";

    if (context.program === "PUPPY_PACKAGE") {
      explanation = "This package gives your puppy the right foundations early, with simple homework between sessions so you know exactly what to practice. It is a strong fit for potty training, crate work, biting, chewing, and building structure before little issues grow.";
    } else if (context.program === "ACADEMY") {
      explanation = "Academy is a strong fit when you need faster progress or want trainers to handle the heavy lifting first. It saves you time, gives your dog daily structure, and lets us hand you a clearer plan to maintain at home.";
    } else {
      explanation = "This program gives you structured coaching over multiple sessions, so you can make steady progress without guessing what to do next. It is a strong fit when you need real change and want better follow-through, leadership, and consistency at home.";
    }

    if (context.has_single_session_option) {
      explanation = `${explanation} ${SINGLE_SESSION_EXPLANATION}`;
    }

    return explanation;
  }

  function renderSecondaryCopy(primaryProgramId, secondaryProgram) {
    if (!secondaryProgram) {
      return "";
    }

    if (secondaryProgram.name === PROGRAM_DETAILS.SINGLE_SESSION.name) {
      return `
        <p class="program-result-secondary">
          If you feel confident with training and just want expert eyes and a live demonstration for this one specific issue, a
          <a href="${secondaryProgram.anchor}">${secondaryProgram.name}</a>
          is also available.
        </p>
      `;
    }

    const intensityLead =
      primaryProgramId === "ACADEMY"
        ? "Prefer something less intensive?"
        : "Prefer something more intensive?";

    return `
      <p class="program-result-secondary">
        ${intensityLead}
        <a href="${secondaryProgram.anchor}">${secondaryProgram.name}</a>
        could also be a fit.
      </p>
    `;
  }
});
