#!/usr/bin/env python3
"""Generate go-home playbooks from shared template."""
from pathlib import Path

PRINT_CSS = r'''  <style>
    @media print {
      html,
      body,
      .slideshow,
      .slide,
      .slide-shell,
      .slide-shell--wide {
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
      }

      body {
        font-size: 10.5pt !important;
        line-height: 1.34 !important;
      }

      h1 { font-size: 21pt !important; }
      h2 { font-size: 15pt !important; }
      h3 { font-size: 11.7pt !important; }

      .support-copy,
      .eyebrow,
      .label,
      .cover-meta,
      .slide-footer,
      .contact-line {
        font-size: 9.2pt !important;
      }

      .panel,
      .concept-card,
      .callout {
        padding: 0.58rem 0.68rem 0.62rem 0.78rem !important;
      }

      .concept-card { padding-left: 2.55rem !important; }
      .concept-card::before {
        left: 0.62rem !important;
        top: 0.62rem !important;
        width: 1.42rem !important;
        height: 1.42rem !important;
      }

      .grid-2 {
        display: block !important;
        margin-top: 0.32rem !important;
      }

      .grid-2 > .panel {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        margin-top: 0.32rem !important;
      }

      .panel + .panel,
      .callout { margin-top: 0.32rem !important; }

      /* Single-column flow prevents command/concept cards from splitting mid-panel in PDF */
      .slide[data-slide="5"] .slide-shell,
      .slide[data-slide="6"] .slide-shell,
      .slide[data-slide="7"] .slide-shell {
        display: block !important;
      }

      .slide[data-slide="5"] .concept-grid {
        display: block !important;
        margin-top: 0.32rem !important;
      }

      .slide[data-slide="5"] .concept-card,
      .slide[data-slide="6"] .panel--cmd,
      .slide[data-slide="7"] .panel--cmd {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        margin-top: 0.32rem !important;
      }

      .slide[data-slide="3"] .panel {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }

      .slide[data-slide="6"] {
        break-before: page !important;
        page-break-before: always !important;
      }

      .slide[data-slide="8"] {
        break-before: page !important;
        page-break-before: always !important;
      }

      .slide[data-slide="9"] {
        break-before: page !important;
        page-break-before: always !important;
      }

      .slide[data-slide="9"] .panel--highlight,
      .slide[data-slide="9"] li,
      .slide[data-slide="9"] .slide-footer {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
    }
  </style>'''

CMD_A = '''
        <article class="panel panel--cmd">
          <h3>{name} (name)</h3>
          <p class="label">Means</p>
          <p>Look at me / check in.</p>
          <p class="label">Your practice</p>
          <p>Say her name once. When she looks, mark with <strong>Yes</strong> and reward. Her name should mean attention, not background noise.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Sit</h3>
          <p class="label">Means</p>
          <p>Bottom on the floor; a polite default before food, doors, and greetings.</p>
          <p class="label">Your practice</p>
          <p>Ask for <strong>Sit</strong> before attention and meals. If you are holding the sit, release with <strong>{release_word}</strong> when you are done.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Down</h3>
          <p class="label">Means</p>
          <p>Lie down and settle her body.</p>
          <p class="label">Your practice</p>
          <p>Use short reps first. Mark with <strong>Yes</strong>, build duration with <strong>Good</strong>, then release with <strong>{release_word}</strong>.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Place</h3>
          <p class="label">Means</p>
          <p>Go to her bed/mat and stay there until <strong>{release_word}</strong>.</p>
          <p class="label">Your practice</p>
          <p>Use <strong>Place</strong> during meals, guests, TV time, and whenever she needs an off switch.</p>
        </article>'''

CMD_B = '''
        <article class="panel panel--cmd">
          <h3>Inside</h3>
          <p class="label">Means</p>
          <p>Go into her crate.</p>
          <p class="label">Your practice</p>
          <p>Use it for naps, bedtime, and safe management. Release with <strong>{release_word}</strong> when you are ready for her to come out calmly.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Wait</h3>
          <p class="label">Means</p>
          <p>Pause - do not move through the threshold or toward the food until <strong>{release_word}</strong>.</p>
          <p class="label">Your practice</p>
          <p>Use <strong>Wait</strong> at meals, exterior doors, gates, and car doors.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Hurry Up</h3>
          <p class="label">Means</p>
          <p>Potty outside - now.</p>
          <p class="label">Your practice</p>
          <p>Say <strong>Hurry Up</strong> at her potty spot; stay boring until she goes, then <strong>Yes</strong> and a real payoff.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Come</h3>
          <p class="label">Means</p>
          <p>Move toward you and check in.</p>
          <p class="label">Your practice</p>
          <p>Call <strong>Come</strong> when she is likely to succeed, then reward generously. Keep early reps short and low-distraction so recall stays reliable.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Go to sleep</h3>
          <p class="label">Means</p>
          <p>At night, relax again and settle back down.</p>
          <p class="label">Your practice</p>
          <p>Keep it boring and consistent. Say <strong>Go to sleep</strong>, reduce attention, and give her the chance to settle.</p>
        </article>'''


def concept_block(cards):
    chunks = []
    for i in range(0, len(cards), 2):
        pair = cards[i : i + 2]
        items = []
        for step, (title, body) in enumerate(pair, start=i + 1):
            items.append(
                f'''          <article class="concept-card" data-step="{step}">
            <h3>{title}</h3>
            <p>{body}</p>
          </article>'''
            )
        chunks.append("        <div class=\"concept-grid\">\n" + "\n".join(items) + "\n        </div>")
    return "\n\n".join(chunks)


def render(data):
    name = data["name"]
    eyebrow = data["eyebrow"]
    program_sub = data["program_sub"]
    lead = data["lead"]
    cover_meta = data["cover_meta"]
    cover_src = data["cover_src"]
    cover_alt = data["cover_alt"]
    personality_html = data["personality_html"]
    potty_html = data["potty_html"]
    comm_note = data.get(
        "comm_note",
        f"{name} does best when the words stay clean and consistent. Say less, time it well, and make the consequence obvious.",
    )
    ant_ant_html = data.get(
        "ant_ant_html",
        f"<p><strong>Ant ant</strong> is her correction/interrupter. Say it once, then immediately help her make the right choice: reset the doorway, guide her back to <strong>Place</strong>, or ask for a known command.</p>",
    )
    concepts_html = data["concepts_html"]
    daily_homework = data["daily_homework"]
    manners_html = data["manners_html"]
    closing_note = data["closing_note"]
    homework_items = data["homework_items"]
    pronoun_subject = data.get("pronoun_subject", "she")
    pronoun_object = data.get("pronoun_object", "her")
    pronoun_poss = "her" if pronoun_subject == "she" else "his"
    release_word = data.get("release_word", "Free")

    cmd_a = data.get("cmd_a") or CMD_A.format(name=name, release_word=release_word)
    cmd_b = data.get("cmd_b") or CMD_B.format(release_word=release_word)
    free_behaviors = data.get(
        "free_behaviors",
        "Sit, Down, Place, Wait, or Inside",
    )
    commands_intro = data.get(
        "commands_intro",
        f"{name} knows these behaviors. Your job is to help {pronoun_object} learn that your voice, timing, and house rules mean the same thing. Duration behaviors end with <strong>{release_word}</strong> when you are finished holding the position.",
    )
    commands_slide7_title = data.get(
        "commands_slide7_title",
        f"Commands {name} knows: house and movement",
    )
    homework_list = "\n".join(f"            <li>{item}</li>" for item in homework_items)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>{name}&apos;s Go-Home Playbook | Crowned K9s</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="../stella-go-home-playbook/style.css">
  <link rel="icon" type="image/png" href="../pictures/Logos/Crowned Icons-02.png">
{PRINT_CSS}
</head>
<body>
  <header class="ebook-topbar" aria-label="Playbook toolbar">
    <a class="ebook-topbar__brand" href="https://crownedk9s.com" target="_blank" rel="noopener">
      <img src="../pictures/Logos/Crowned Icons-02.png" alt="Crowned K9s">
      <div>
        <div class="ebook-topbar__title">{name}&apos;s Go-Home Playbook</div>
        <div class="ebook-topbar__sub">{program_sub}</div>
      </div>
    </a>
    <div class="ebook-topbar__actions">
      <button type="button" class="btn-accent" data-action="print">Save / Print PDF</button>
      <a class="btn-ghost" href="https://crownedk9s.com/contact" target="_blank" rel="noopener">Contact</a>
    </div>
  </header>

  <main class="slideshow" aria-label="{name} go-home playbook slideshow">
    <section class="slide slide--hero is-active" data-slide="1" aria-label="Cover">
      <div class="slide-shell">
        <p class="eyebrow">{eyebrow}</p>
        <h1>{name}&apos;s Go-Home Playbook</h1>
        <p class="lead lead--center">{lead}</p>
        <p class="cover-meta">{cover_meta}</p>
        <div class="cover-frame">
          <img class="cover-photo" src="{cover_src}" alt="{cover_alt}" width="640" height="640" loading="eager" decoding="async">
        </div>
        <p class="cover-tagline">Lead with Confidence, Train with Crowned K9s.</p>
      </div>
    </section>

    <section class="slide" data-slide="2" aria-label="Who {name} is">
      <div class="slide-shell">
        <div class="section-kicker">
          <span class="section-kicker__icon" aria-hidden="true">CK</span>
          <p class="eyebrow" style="margin:0">Know your pup</p>
        </div>
        <h2>Who {name} is</h2>
{personality_html}
      </div>
    </section>

    <section class="slide" data-slide="3" aria-label="Daily rhythm and potty structure">
      <div class="slide-shell">
        <div class="section-kicker">
          <span class="section-kicker__icon" aria-hidden="true">01</span>
          <p class="eyebrow" style="margin:0">Your daily structure</p>
        </div>
        <h2>Potty rhythm, crate rhythm, and calm resets</h2>
{potty_html}
      </div>
    </section>

    <section class="slide" data-slide="4" aria-label="Communication system">
      <div class="slide-shell">
        <div class="section-kicker">
          <span class="section-kicker__icon" aria-hidden="true">02</span>
          <p class="eyebrow" style="margin:0">Communication</p>
        </div>
        <h2>Yes, Good, {release_word}, and corrections</h2>
        <p class="support-copy">{comm_note}</p>

        <div class="panel panel--highlight">
          <h3>Yes</h3>
          <p>Use <strong>Yes</strong> to mark the exact moment {pronoun_subject} gets it right, then reward. Example: {pronoun_poss} bottom hits the floor on <strong>Sit</strong> -&gt; <strong>Yes</strong> -&gt; food, praise, touch, or access.</p>
        </div>

        <div class="panel">
          <h3>Good</h3>
          <p>Use <strong>Good</strong> to tell {pronoun_object} to keep holding the behavior. This is useful for <strong>Place</strong>, <strong>Down</strong>, and calm greetings.</p>
        </div>

        <div class="panel">
          <h3>{release_word}</h3>
          <p><strong>{release_word}</strong> is {pronoun_poss} <strong>release word</strong>. After <strong>{free_behaviors}</strong>, {pronoun_subject} should wait for <strong>{release_word}</strong> before getting up, bolting through a door, or diving at the food bowl.</p>
        </div>

        <div class="panel">
          <h3>Ant ant</h3>
          {ant_ant_html}
        </div>

        <div class="callout">
          <strong>Important:</strong> do not nag. One cue, one correction if needed, then guide the outcome.
        </div>
      </div>
    </section>

    <section class="slide" data-slide="5" aria-label="Training concepts and homework">
      <div class="slide-shell slide-shell--wide">
        <div class="section-kicker">
          <span class="section-kicker__icon" aria-hidden="true">03</span>
          <p class="eyebrow" style="margin:0">How {pronoun_subject} was taught</p>
        </div>
        <h2>Training concepts that keep {name} successful</h2>
        <p class="support-copy">{name} was not just taught words; {pronoun_subject} was taught a system. These concepts are the homework that keeps {pronoun_poss} training from fading once {pronoun_subject} is home.</p>
{concepts_html}
        <div class="callout" style="margin-top:1rem">
          <strong>Daily homework:</strong> {daily_homework}
        </div>
      </div>
    </section>

    <section class="slide" data-slide="6" aria-label="Commands {name} knows part one">
      <div class="slide-shell slide-shell--wide">
        <div class="section-kicker">
          <span class="section-kicker__icon" aria-hidden="true">04</span>
          <p class="eyebrow" style="margin:0">What {pronoun_subject} knows</p>
        </div>
        <h2>Commands {name} knows: foundation</h2>
        <p class="support-copy">{commands_intro}</p>
{cmd_a}
      </div>
    </section>

    <section class="slide" data-slide="7" aria-label="Commands {name} knows part two">
      <div class="slide-shell slide-shell--wide">
        <div class="section-kicker">
          <span class="section-kicker__icon" aria-hidden="true">05</span>
          <p class="eyebrow" style="margin:0">Home life cues</p>
        </div>
        <h2>{commands_slide7_title}</h2>
{cmd_b}
      </div>
    </section>

    <section class="slide" data-slide="8" aria-label="Household manners">
      <div class="slide-shell">
        <div class="section-kicker">
          <span class="section-kicker__icon" aria-hidden="true">06</span>
          <p class="eyebrow" style="margin:0">House manners</p>
        </div>
{manners_html}
      </div>
    </section>

    <section class="slide" data-slide="9" aria-label="Support and next steps">
      <div class="slide-shell">
        <div class="section-kicker">
          <span class="section-kicker__icon" aria-hidden="true">CK</span>
          <p class="eyebrow" style="margin:0">Welcome home</p>
        </div>
        <h2>You are not on your own</h2>
        <p class="support-copy">{closing_note}</p>

        <div class="panel panel--highlight">
          <h3>Your homework plan</h3>
          <ol>
{homework_list}
          </ol>
        </div>

        <div class="slide-footer">
          <p><strong>Lead with Confidence, Train with Crowned K9s.</strong></p>
          <p class="contact-line">
            <a href="tel:9198162426">Text: 919-816-2426</a>
            &middot;
            <a href="mailto:lorenzo@crownedk9s.com">lorenzo@crownedk9s.com</a>
            &middot;
            <a href="https://crownedk9s.com" target="_blank" rel="noopener">crownedk9s.com</a>
          </p>
        </div>
      </div>
    </section>

    <div class="slide-controls" aria-label="Playbook controls">
      <button class="nav-button" type="button" data-action="prev" aria-label="Previous slide">Previous</button>
      <div class="slide-progress">
        <span class="slide-progress-current">01</span>
        <span class="slide-progress-divider">/</span>
        <span class="slide-progress-total">09</span>
      </div>
      <button class="nav-button" type="button" data-action="next" aria-label="Next slide">Next</button>
    </div>

    <div class="slide-dots" aria-label="Slide selection">
      <button class="slide-dot is-active" type="button" data-target="1" aria-label="Go to slide 1"></button>
      <button class="slide-dot" type="button" data-target="2" aria-label="Go to slide 2"></button>
      <button class="slide-dot" type="button" data-target="3" aria-label="Go to slide 3"></button>
      <button class="slide-dot" type="button" data-target="4" aria-label="Go to slide 4"></button>
      <button class="slide-dot" type="button" data-target="5" aria-label="Go to slide 5"></button>
      <button class="slide-dot" type="button" data-target="6" aria-label="Go to slide 6"></button>
      <button class="slide-dot" type="button" data-target="7" aria-label="Go to slide 7"></button>
      <button class="slide-dot" type="button" data-target="8" aria-label="Go to slide 8"></button>
      <button class="slide-dot" type="button" data-target="9" aria-label="Go to slide 9"></button>
    </div>
  </main>

  <script src="../stella-go-home-playbook/script.js"></script>
</body>
</html>
"""


zoey = {
    "name": "Zoey",
    "release_word": "Break",
    "eyebrow": "Crowned K9s Premium Puppy Placement Academy",
    "program_sub": "Crowned K9s &middot; Premium Puppy Placement",
    "lead": "Your guide to living with Zoey: clear communication, smart structure, food-motivated training, and the consistency that helps a freedom-loving puppy thrive at home.",
    "cover_meta": "Golden Cavapoo &middot; Born March 12, 2026 &middot; Private family playbook",
    "cover_src": "../pictures/PRP/Zoey/IMG_0785.jpg",
    "cover_alt": "Zoey the Golden Cavapoo puppy",
    "personality_html": """
        <div class="panel">
          <h3>Personality</h3>
          <ul>
            <li><strong>Very smart</strong> - Zoey learns quickly and notices patterns in your home.</li>
            <li><strong>Values freedom</strong> - she does best when rules are clear and earned freedom is part of the reward system.</li>
            <li><strong>Food motivated</strong> - use meals, treats, and food-based rewards to keep training fair and fun.</li>
            <li><strong>Great temperament</strong> - she is a sweet, capable puppy with a bright future.</li>
          </ul>
        </div>

        <div class="panel panel--highlight">
          <h3>Energy and follow-through</h3>
          <p>Zoey has spurts of puppy energy and can be <strong>slightly stubborn</strong>. That means consistency and follow-through matter. If you ask for something, help her finish it calmly instead of repeating yourself until she tunes you out.</p>
        </div>

        <div class="panel">
          <h3>Car rides and motion sickness</h3>
          <p>Zoey can have <strong>bouts of car sickness</strong>, especially as rides get longer. This is common in puppies and usually improves with structure and practice.</p>
          <ul>
            <li><strong>Dog car seat:</strong> use a secure car seat and keep her <strong>attached to it</strong> so she stays balanced instead of sliding around.</li>
            <li><strong>Pee pads in the car:</strong> bring pads for now in case she gets sick or needs an emergency potty stop.</li>
            <li><strong>Small food distractions:</strong> a passenger can offer tiny pieces of food during the ride to help her stay settled.</li>
            <li><strong>Build up slowly:</strong> start with short trips and gradually work up to longer rides. With consistency, she should grow out of this.</li>
          </ul>
        </div>

        <div class="panel">
          <h3>Daily tether time</h3>
          <p>Highly recommend <strong>tethering Zoey once a day</strong> near you while you go about normal life. It teaches her to manage her emotions, relax, and be bored without rehearsing jumping, mouthing, or demand behaviors. Keep it calm and reward quiet choices.</p>
        </div>

        <div class="callout">
          <strong>Helpful tool:</strong> she can be a little whiney when bored. A frozen Kong, lick mat, or high-value chew helps her settle and keeps her occupied.
        </div>""",
    "potty_html": """
        <div class="panel panel--highlight" style="margin-top:1rem">
          <h3>The four potty triggers</h3>
          <p>When in doubt, take Zoey out. Puppies need predictable chances to get it right.</p>
          <ol style="margin:0.75rem 0 0; padding-left:1.25rem; line-height:1.7;">
            <li><strong>After eating</strong> - usually within 5-15 minutes of a meal</li>
            <li><strong>After drinking</strong> - plan a quick trip after water</li>
            <li><strong>After waking up</strong> - nap ends, potty starts</li>
            <li><strong>After playing</strong> - when play slows down, go out right away</li>
          </ol>
        </div>

        <div class="panel panel--highlight" style="margin-top:1rem">
          <h3>Zoey&apos;s morning rhythm</h3>
          <p><strong>She poops first thing in the morning.</strong> Plan for an immediate potty trip when she wakes up. She typically averages about <strong>2-3 poops per day</strong>, so keep outings predictable rather than waiting for a signal.</p>
        </div>

        <div class="grid-2" style="margin-top:1rem">
          <div class="panel">
            <h3>Sample rhythm</h3>
            <p>First potty -&gt; short training -&gt; eat -&gt; potty -&gt; alone crate time -&gt; potty -&gt; play -&gt; potty -&gt; <strong>Place</strong> or calm time.</p>
          </div>
          <div class="panel">
            <h3>Alone crate time every day</h3>
            <p>Zoey needs <strong>alone crate time daily</strong> to build independence and help prevent separation anxiety. Keep departures boring and return low-key.</p>
          </div>
        </div>

        <div class="panel" style="margin-top:1rem">
          <h3>Hurry Up - her potty cue</h3>
          <p>At her potty spot, say <strong>Hurry Up</strong> once. Stay neutral until she goes, then mark <strong>Yes</strong> and pay big. Consistency builds speed outside.</p>
        </div>

        <div class="callout">
          <strong>Reminder:</strong> when she whines in the crate, first ask whether she needs potty, food, or rest. If she is simply bored, use enrichment instead of letting her out for attention only.
        </div>""",
    "comm_note": "Zoey is smart enough to test gray areas. Clean communication and follow-through keep her confident instead of pushy.",
    "ant_ant_html": "<p><strong>Ant ant</strong> is her correction/interrupter. Say it once with calm authority, then immediately guide the right choice: reset the doorway, return to <strong>Place</strong>, or ask for a known command.</p>",
    "concepts_html": concept_block(
        [
            ("The staircase", "Train step by step. If Zoey struggles, make the rep easier: less distance, less duration, fewer distractions. Win small, then build back up."),
            ("The cliffhanger", "Keep reps <strong>short</strong> (often 1-2 minutes). End on a success while she is still engaged—leave her wanting more."),
            ("Clear communication", "Use <strong>Yes</strong>, <strong>Good</strong>, and <strong>Break</strong> daily. Avoid repeating commands. One cue, one outcome."),
            ("The scoreboard", "A rep counts when <strong>you</strong> release her with <strong>Break</strong>. Self-releases mean the next rep should be shorter or easier."),
            ("Follow-through", "If Zoey ignores a known behavior, do not nag. Reset, make the rep easier, and help her succeed."),
            ("Independence and calm structure", "Daily alone crate time and planned tether time teach her that quiet rest and boredom are normal, safe, and not something to panic about."),
        ]
    ),
    "cmd_a": CMD_A.format(name="Zoey", release_word="Break")
    + """
        <article class="panel panel--cmd">
          <h3>Shake</h3>
          <p class="label">Means</p>
          <p>Offer her paw for a polite greeting or fun training rep.</p>
          <p class="label">Your practice</p>
          <p>This is a newer behavior for Zoey. Ask for <strong>Shake</strong> in low-distraction moments, mark with <strong>Yes</strong>, and reward generously so it stays fun and reliable.</p>
        </article>""",
    "daily_homework": "3-5 minute reps, several times per day. Practice name response, Sit/Down duration, Place, Shake, Wait at doors, Inside, Come, morning potty, tether time, and calm crate exits. End on a win and release with <strong>Break</strong>.",
    "manners_html": """
        <h2>Freedom, consistency, and household manners</h2>

        <div class="panel panel--highlight">
          <h3>Consistency beats repetition</h3>
          <p>If you ask for <strong>Sit</strong>, <strong>Place</strong>, or <strong>Wait</strong>, follow through calmly until Zoey completes the behavior or you reset the rep. Mixed follow-through teaches a smart dog to wait you out.</p>
        </div>

        <div class="panel">
          <h3>Use food wisely</h3>
          <p>Reward calm choices before excitement takes over. Meals, doorways, greetings, and crate time are perfect places to pay her for good decisions.</p>
        </div>

        <div class="panel">
          <h3>Enrichment for whining</h3>
          <p>If Zoey gets vocal when she wants attention, redirect to a frozen Kong, lick mat, or high-value chew before she rehearses whining as a strategy.</p>
        </div>

        <div class="panel">
          <h3>Tether once a day</h3>
          <p>Daily tether time helps Zoey learn to settle near you without rehearsing pushy behavior. It builds emotional regulation: relax, be bored, and wait calmly while life happens around her.</p>
        </div>""",
    "closing_note": "Zoey has a strong start, and now the goal is transfer: same rules, same words, same calm structure in your home. Questions are expected, especially during the first week.",
    "homework_items": [
        "<strong>Communication:</strong> use <strong>Yes</strong>, <strong>Good</strong>, and <strong>Break</strong> every day. One cue, one outcome.",
        "<strong>Morning potty:</strong> first trip outside right when she wakes up. She usually poops first thing in the morning.",
        "<strong>Triggers:</strong> honor all four potty triggers and use <strong>Hurry Up</strong> consistently outside.",
        "<strong>Alone crate time:</strong> give Zoey planned alone crate time every day to build independence.",
        "<strong>Tether daily:</strong> tether her once a day near you so she learns to relax, manage her emotions, and be bored calmly.",
        "<strong>Car rides:</strong> use a secured dog car seat, bring pee pads for now, offer small food distractions, and build from short trips to longer ones.",
        "<strong>Follow-through:</strong> if you ask for a behavior, help her finish it calmly instead of repeating yourself.",
        "<strong>Enrichment:</strong> keep frozen Kongs or high-value chews ready for whiny or bored moments.",
        "<strong>Short sessions:</strong> practice commands in happy 3-5 minute reps so she learns your voice without getting frustrated.",
        "Reach out when unsure; do not guess.",
    ],
}

marley = {
    "name": "Marley",
    "eyebrow": "Crowned K9s Find My Puppy · Service Dog Prospect",
    "program_sub": "Crowned K9s &middot; Find My Puppy Academy",
    "lead": "Your guide to living with Marley: clear communication, proactive potty structure, calm authority, and the foundation that supports her service-dog prospect development.",
    "cover_meta": "Service dog prospect &middot; Private family playbook",
    "cover_src": "../pictures/PRP/Marley-cover.jpg",
    "cover_alt": "Marley the service dog prospect puppy",
    "personality_html": """
        <div class="panel">
          <h3>Personality</h3>
          <ul>
            <li><strong>Super sweet</strong> - Marley is affectionate, gentle, and very people-oriented.</li>
            <li><strong>Sensitive but confident</strong> - she notices tone and energy, but she is not fragile.</li>
            <li><strong>Responsive to authoritative energy</strong> - calm, clear leadership helps her feel secure and make good choices.</li>
            <li><strong>Excellent temperament</strong> - in our opinion, she is a natural for service work development.</li>
          </ul>
        </div>

        <div class="panel panel--highlight">
          <h3>Correction word: Ant ant</h3>
          <p>Marley is <strong>very responsive to &quot;Ant ant&quot;</strong>. Use it once with calm authority, then immediately guide her into the right behavior. Do not repeat it or escalate emotionally.</p>
        </div>

        <div class="callout">
          <strong>Leadership note:</strong> sweet does not mean soft. Marley thrives when expectations are clear, fair, and consistent.
        </div>""",
    "potty_html": """
        <div class="panel panel--highlight" style="margin-top:1rem">
          <h3>The four potty triggers</h3>
          <p>When in doubt, take Marley out. Do not wait for her to tell you.</p>
          <ol style="margin:0.75rem 0 0; padding-left:1.25rem; line-height:1.7;">
            <li><strong>After eating</strong> - usually within 5-15 minutes of a meal</li>
            <li><strong>After drinking</strong> - plan a quick trip after water</li>
            <li><strong>After waking up</strong> - nap ends, potty starts</li>
            <li><strong>After playing</strong> - when play slows down, go out right away</li>
          </ol>
        </div>

        <div class="panel panel--highlight" style="margin-top:1rem">
          <h3>Critical crate note: she is too quiet</h3>
          <p>Marley is <strong>so quiet in her crate that she will not make a noise</strong> even if she needs to potty. She also does not mind sitting in her pee or stepping on her poop. You cannot rely on whining as a signal.</p>
          <p style="margin-top:0.75rem"><strong>Your rule:</strong> let her outside after every trigger, and especially <strong>before she wakes up and stands up</strong>. If you wait until she is already standing, you may look over and find her standing in her pee.</p>
        </div>

        <div class="grid-2" style="margin-top:1rem">
          <div class="panel">
            <h3>Proactive schedule</h3>
            <p>Wake her for potty before she stands on her own. Honor every trigger. Last potty before rest. First potty after rest.</p>
          </div>
          <div class="panel">
            <h3>Use the crate as structure</h3>
            <p><strong>Inside</strong> means go into her crate for naps, safe breaks, and calm downtime. The crate supports her service foundation, not just house training.</p>
          </div>
        </div>

        <div class="panel" style="margin-top:1rem">
          <h3>Hurry Up - her potty cue</h3>
          <p>At her potty spot, say <strong>Hurry Up</strong> once. Stay neutral until she goes, then mark <strong>Yes</strong> and pay big.</p>
        </div>

        <div class="callout">
          <strong>Remember:</strong> with Marley, prevention is everything. Proactive outings beat cleanup every time.
        </div>""",
    "comm_note": "Marley responds best to calm, authoritative communication. Clear words and consistent follow-through help her feel secure.",
    "ant_ant_html": "<p><strong>Ant ant</strong> is her correction/interrupter and she responds to it very well. Say it once with calm authority, then guide her back to <strong>Place</strong>, reset the doorway, or ask for a known command.</p>",
    "concepts_html": concept_block(
        [
            ("The staircase", "Train step by step. If Marley struggles, make the rep easier: less distance, less duration, fewer distractions. Win small, then build back up."),
            ("The cliffhanger", "Keep reps <strong>short</strong> (often 1-2 minutes). End on a success while she is still engaged—leave her wanting more."),
            ("Clear communication", "Use <strong>Yes</strong>, <strong>Good</strong>, and <strong>Free</strong> daily. Avoid extra talking during commands."),
            ("The scoreboard", "A rep counts when <strong>you</strong> release her with <strong>Free</strong>. Reset calmly if she self-releases."),
            ("Authoritative calm", "Lead with calm confidence. Marley is sensitive and responds well to fair, steady leadership."),
            ("Proactive potty structure", "Do not wait for a signal. Take her out on schedule, especially before she stands up in the crate."),
        ]
    ),
    "daily_homework": "3-5 minute reps, several times per day. Practice name response, Sit/Down duration, Place, Wait at doors, Inside, Come, proactive potty outings, and calm crate exits. End on a win and release with <strong>Free</strong>.",
    "manners_html": """
        <h2>Leadership, boundaries, and service foundation</h2>

        <div class="panel panel--highlight">
          <h3>Calm authority</h3>
          <p>Marley does best when you are calm, clear, and consistent. Sweet praise for good choices, fair correction for unwanted ones, and no emotional nagging.</p>
        </div>

        <div class="panel">
          <h3>Doorway manners</h3>
          <p>Practice <strong>Wait</strong> at thresholds and release with <strong>Free</strong>. Impulse control at doors supports both house manners and future public access work.</p>
        </div>

        <div class="panel">
          <h3>Place and crate as off switches</h3>
          <p>Use <strong>Place</strong> and <strong>Inside</strong> during busy home life so Marley learns how to settle around movement, guests, and changing environments.</p>
        </div>""",
    "closing_note": "Marley has an excellent temperament and a strong foundation. Your job now is to protect structure, communication, and proactive potty rhythm so she can keep growing into the service prospect we believe she can become.",
    "homework_items": [
        "<strong>Communication:</strong> use <strong>Yes</strong>, <strong>Good</strong>, and <strong>Free</strong> every day. Pair with calm, authoritative leadership.",
        "<strong>Proactive potty:</strong> honor all four triggers and take Marley out before she stands up in the crate.",
        "<strong>Do not wait for whining:</strong> she is too quiet to signal bathroom needs reliably.",
        "<strong>Doorways and food:</strong> practice <strong>Wait</strong> before meals, exterior doors, gates, crate doors, and car doors. Release with <strong>Free</strong>.",
        "<strong>Ant ant:</strong> use once with authority, then guide the correct behavior immediately.",
        "<strong>Calm structure:</strong> use <strong>Place</strong>, <strong>Inside</strong>, and <strong>Go to sleep</strong> before she gets overtired.",
        "<strong>Short sessions:</strong> practice commands in happy 3-5 minute reps so Marley learns your voice without getting frustrated.",
        "Reach out when unsure; do not guess.",
    ],
}


WINNIE_CMD_A = """
        <article class="panel panel--cmd">
          <h3>Winnie (name)</h3>
          <p class="label">Means</p>
          <p>Look in your eyes / check in.</p>
          <p class="label">Your practice</p>
          <p>Say <strong>Winnie</strong> once. When she looks at you, mark with <strong>Yes</strong> and reward. Her name should mean attention, not background noise.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Sit</h3>
          <p class="label">Means</p>
          <p>Bottom on the floor; a polite default before food, play, and greetings.</p>
          <p class="label">Your practice</p>
          <p>Ask for <strong>Sit</strong> before meals and attention. You can also use light <strong>upward leash pressure</strong> to help her understand. Release with <strong>Break</strong> when you are done holding the position.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Down</h3>
          <p class="label">Means</p>
          <p>Lie down and settle her body.</p>
          <p class="label">Your practice</p>
          <p>Use short reps first. Mark with <strong>Yes</strong>, build duration with <strong>Good</strong>, then release with <strong>Break</strong>. Light <strong>downward leash pressure</strong> can help guide her into position.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Place</h3>
          <p class="label">Means</p>
          <p>Go to her bed/mat and stay there until <strong>Break</strong>.</p>
          <p class="label">Your practice</p>
          <p>Use <strong>Place</strong> during meals, guests, TV time, and whenever she needs an off switch.</p>
        </article>"""

WINNIE_CMD_B = """
        <article class="panel panel--cmd">
          <h3>Wait</h3>
          <p class="label">Means</p>
          <p>Pause at the food bowl until you release with <strong>Break</strong>.</p>
          <p class="label">Your practice</p>
          <p>Use <strong>Wait</strong> before every meal. Do not let her dive in until you say <strong>Break</strong>.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Hurry Up</h3>
          <p class="label">Means</p>
          <p>Potty outside - now.</p>
          <p class="label">Your practice</p>
          <p>Say <strong>Hurry Up</strong> at her potty spot; stay boring until she goes, then <strong>Yes</strong> and a real payoff.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Come (kissy sounds)</h3>
          <p class="label">Means</p>
          <p>Move toward you when she hears your recall sound.</p>
          <p class="label">Your practice</p>
          <p>Winnie has been taught to come to <strong>kissy sounds</strong>, not only the word &quot;Come.&quot; Use the same sound consistently, reward generously when she commits, and keep early reps easy.</p>
        </article>

        <article class="panel panel--cmd">
          <h3>Leash pressure</h3>
          <p class="label">Means</p>
          <p><strong>Upward</strong> leash pressure means <strong>Sit</strong>. <strong>Downward</strong> leash pressure means <strong>Down</strong>.</p>
          <p class="label">Your practice</p>
          <p>Use light, fair pressure as guidance—not a tug-of-war. Pair pressure with the verbal cue, mark with <strong>Yes</strong>, and reward when she responds.</p>
        </article>"""

winnie = {
    "name": "Winnie",
    "release_word": "Break",
    "eyebrow": "Crowned K9s Find My Puppy Academy",
    "program_sub": "Crowned K9s &middot; Find My Puppy Academy",
    "lead": "Your guide to living with Winnie: clear communication, smart potty structure, daily tether and crate rhythm, and the play-and-cuddle balance that helps a sweet Golden thrive at home.",
    "cover_meta": "Golden Retriever &middot; Private family playbook",
    "cover_src": "../pictures/PRP/Winnie/winnie-cover.jpg",
    "cover_alt": "Winnie the Golden Retriever puppy",
    "free_behaviors": "Sit, Down, Place, or Wait",
    "commands_intro": "Winnie knows these behaviors. Your job is to help her learn that your voice, leash guidance, timing, and house rules mean the same thing. Duration behaviors end with <strong>Break</strong> when you are finished holding the position.",
    "commands_slide7_title": "Commands Winnie knows: potty, recall, and leash",
    "cmd_a": WINNIE_CMD_A,
    "cmd_b": WINNIE_CMD_B,
    "personality_html": """
        <div class="panel">
          <h3>Personality</h3>
          <ul>
            <li><strong>Very sweet</strong> - Winnie is affectionate and loves to cuddle.</li>
            <li><strong>Playful energy</strong> - she gets very energetic when she switches into play mode.</li>
            <li><strong>Loves toys</strong> - play and toys are a big part of what motivates her.</li>
            <li><strong>Physical touch</strong> - praise, petting, and closeness all matter to her.</li>
          </ul>
        </div>

        <div class="panel panel--highlight">
          <h3>Motivation</h3>
          <p>Winnie is <strong>food motivated until she is full or over it</strong>, very <strong>toy and play motivated</strong>, and loves physical touch. Rotate food, toys, touch, and praise so she stays engaged without getting overstimulated.</p>
        </div>

        <div class="callout">
          <strong>Daily structure:</strong> highly recommend <strong>tethering her once a day</strong> for calm learning, and letting her <strong>sleep in the crate once a day</strong> to help prevent separation anxiety.
        </div>""",
    "potty_html": """
        <div class="panel panel--highlight" style="margin-top:1rem">
          <h3>The four potty triggers</h3>
          <p>When in doubt, take Winnie out. She is doing excellent with potty training—only 2 accidents in 3 weeks—but structure still wins.</p>
          <ol style="margin:0.75rem 0 0; padding-left:1.25rem; line-height:1.7;">
            <li><strong>After eating</strong> - she poops <strong>right after she eats</strong>, so be ready immediately</li>
            <li><strong>After drinking</strong> - plan a quick trip after water; limit water intake to prevent accidents</li>
            <li><strong>After waking up</strong> - nap ends, potty starts</li>
            <li><strong>After playing</strong> - when play slows down, go out right away</li>
          </ol>
        </div>

        <div class="panel panel--highlight" style="margin-top:1rem">
          <h3>Winnie&apos;s potty rhythm</h3>
          <p>She typically poops about <strong>2-3 times per day</strong>, often <strong>right after meals</strong>. Have your shoes on and be ready to go outside as soon as she finishes eating.</p>
          <p style="margin-top:0.75rem"><strong>Great signal:</strong> Winnie will <strong>whine in the crate when she needs to potty</strong>. When you hear it, take her out right away and use <strong>Hurry Up</strong>.</p>
        </div>

        <div class="grid-2" style="margin-top:1rem">
          <div class="panel">
            <h3>Water management</h3>
            <p><strong>Limit her water intake</strong> to help prevent accidents. Offer water with structure rather than free access all day while she is still building house training habits.</p>
          </div>
          <div class="panel">
            <h3>Crate once a day</h3>
            <p>Let Winnie <strong>sleep in the crate once a day</strong> to build independence and help prevent separation anxiety. Keep departures boring and returns low-key.</p>
          </div>
        </div>

        <div class="panel" style="margin-top:1rem">
          <h3>Hurry Up - her potty cue</h3>
          <p>At her potty spot, say <strong>Hurry Up</strong> once. Stay neutral until she goes, then mark <strong>Yes</strong> and pay big.</p>
        </div>

        <div class="callout">
          <strong>Keep the streak going:</strong> Winnie has had very few accidents. Proactive outings and listening for crate whining will protect that progress.
        </div>""",
    "comm_note": "Winnie responds well to clear, upbeat communication. Pair your words with fair leash guidance, toys, touch, and food when she gets it right.",
    "ant_ant_html": "<p><strong>Ant ant</strong> is her correction/interrupter. Say it once, then immediately guide the right choice: return to <strong>Place</strong>, reset the behavior, or ask for a known command.</p>",
    "concepts_html": concept_block(
        [
            ("The staircase", "Train step by step. If Winnie struggles, make the rep easier: less duration, less excitement, fewer distractions. Win small, then build back up."),
            ("The cliffhanger", "Keep reps <strong>short</strong> (often 1-2 minutes). End on a success while she is still engaged—leave her wanting more."),
            ("Clear communication", "Use <strong>Yes</strong>, <strong>Good</strong>, and <strong>Break</strong> daily. One cue, one outcome."),
            ("The scoreboard", "A rep counts when <strong>you</strong> release her with <strong>Break</strong>. Self-releases mean the next rep should be shorter or easier."),
            ("Rotate rewards", "Because she loves food, toys, and touch, mix all three so she stays motivated without getting over-aroused."),
            ("Tether and crate rhythm", "Daily tether time and planned crate rest teach calm structure and help prevent separation anxiety."),
        ]
    ),
    "daily_homework": "3-5 minute reps, several times per day. Practice name response, Sit/Down/Place, Wait at meals, Hurry Up outside, kissy-sound recall, leash pressure, tether time, and calm crate rest. End on a win and release with <strong>Break</strong>.",
    "manners_html": """
        <h2>Play, cuddles, and household manners</h2>

        <div class="panel panel--highlight">
          <h3>Match her energy</h3>
          <p>Winnie loves to cuddle, but she can get <strong>very energetic in play mode</strong>. Use toys and short play bursts, then redirect to <strong>Place</strong> or crate rest before she gets too wild.</p>
        </div>

        <div class="panel">
          <h3>Tether once a day</h3>
          <p>Daily tether time helps Winnie learn to settle near you without rehearsing jumping, mouthing, or demand behaviors. Keep it calm and reward quiet choices.</p>
        </div>

        <div class="panel">
          <h3>Toys and touch as rewards</h3>
          <p>Because she loves toys and physical touch, use them for calm behavior—not only for wild play. A quick toy reward after <strong>Sit</strong> or <strong>Place</strong> can be just as powerful as food.</p>
        </div>""",
    "closing_note": "Winnie has a sweet temperament and a strong potty foundation. Your job now is to keep structure, communication, and daily rhythm consistent so she can keep thriving at home.",
    "homework_items": [
        "<strong>Communication:</strong> use <strong>Yes</strong>, <strong>Good</strong>, and <strong>Break</strong> every day. Pair with <strong>Ant ant</strong> when needed.",
        "<strong>After meals:</strong> take Winnie out right after she eats—she poops immediately after meals.",
        "<strong>Water:</strong> limit water intake to help prevent accidents while house training continues.",
        "<strong>Crate whining:</strong> if she whines in the crate, assume potty first and use <strong>Hurry Up</strong> outside.",
        "<strong>Tether daily:</strong> give Winnie planned tether time once a day for calm learning.",
        "<strong>Crate daily:</strong> let her sleep in the crate once a day to build independence.",
        "<strong>Recall:</strong> use the same <strong>kissy sounds</strong> for come, and reward generously when she commits.",
        "<strong>Leash pressure:</strong> upward means <strong>Sit</strong>, downward means <strong>Down</strong>—keep pressure light and fair.",
        "Reach out when unsure; do not guess.",
    ],
}


def main():
    root = Path(__file__).resolve().parents[1]
    for slug, data in [("zoey", zoey), ("marley", marley), ("winnie", winnie)]:
        out = root / f"{slug}-go-home-playbook" / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(render(data))
        print(f"wrote {out} ({out.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
