Step 0: Explain the project to everyone
Before assigning work, send this to your team group.
Message to the whole team
Hey everyone, here’s what we’re building for the hackathon.
Our project is called Engram. It’s an interactive website that shows how a small neural network remembers patterns.
A user draws a small image, like a cross or arrow. We store it by changing the connections between artificial neurons. Then the user damages the image, and the network tries to reconstruct it.
The interesting part is that users can keep adding memories until they interfere with each other and recall fails. We’ll show the actual calculations, the correct image, the reconstructed image, and why the result went wrong.
This is a real small neural-network model called a Hopfield network—not a chatbot or a prerecorded animation. It will run in the browser, so we don’t need a GPU or paid API.
The hackathon also requires us to explain its relationship to Pathway’s BDH architecture. Our model is not BDH; it’s a simpler model that teaches a related memory principle.
Our first milestone is simple: store a pattern, damage it, and recall it on a webpage. We’ll add charts and polish after that works.

Have a short call afterward. Everyone should be able to explain the project back in one or two sentences.
Step 1: You initialize the shared project
Your tasks, Indra
1. Create a GitHub repository named engram.
2. Initialize React + TypeScript + Vite.
3. Make sure the starter application runs.
4. Add formatting, linting, and test scripts.
5. Create the folders below.
6. Commit the initial setup.
7. Invite everyone as a collaborator.
8. Create a task board with:
   - To do
   - In progress
   - Review
   - Done
Suggested folder ownership:
src/
  shared/          Shared types — you coordinate changes
  engine/          Raghav
  experiments/     Nivedita
  components/
    lab/           You
    charts/        Nivedita
  content/         Amrit
  sections/
    learn/         Amrit
    bdh/           Amrit

tests/
  engine/          Raghav
  evaluation/      Nivedita

docs/
  research/        Amrit
For the first version, create only a basic page containing:
- Project name.
- A placeholder for the pattern editor.
- A placeholder for the recalled pattern.
- Store, Corrupt, and Recall buttons.
Do not spend the first few hours designing the landing page.
Message to the whole team
The repository is ready: [paste repo link].
Please clone it, install the dependencies, and make sure the starter app runs on your laptop.
Work on separate branches and send small pull requests. Please don’t directly change someone else’s folders without discussing it.
Before adding a new library or changing shared types, message the group so we don’t create integration problems.
For every task you finish, send: what works, how I can test it, what is still missing, and your PR link.

Step 2: Give everyone one small starting task
At this point, everyone can work in parallel.
Your objective is to get small, usable outputs, not four large unfinished modules.
2A. Assign the first engine task to Raghav
Message to Raghav — Task 1
Hey Raghav, you’ll own the actual neural-memory engine.
Think of our image as an 8×8 grid. That gives us 64 artificial neurons. Each pixel becomes either +1 or -1. The connections between neurons are stored in a 64×64 matrix.
Your first task is only the storage part:
1. Convert a pattern into a bipolar vector.
2. Create an empty weight matrix.
3. Store patterns using the Hebbian rule:
   W[i,j] += pattern[i] * pattern[j] / N
4. Keep diagonal weights zero.
5. Add small tests proving the matrix is symmetric and matches a hand-calculated example.
Write this in plain TypeScript inside src/engine. Don’t build any UI or backend.
Please first send me a function that accepts patterns and returns the weight matrix. Include a tiny example showing how I call it.
Don’t worry about recall yet—we’ll do that next.

What you should receive:
- A storage function.
- Small tests.
- An example input and output.
2B. Assign the first data task to Nivedita
Message to Nivedita — Task 1
Hey Nivedita, you’ll own our experiment patterns, evaluation, and charts.
First, we need input patterns to test the network. Each pattern is an 8×8 grid containing only +1 and -1.
Please prepare:
1. A few simple visual patterns, such as a cross, arrow, and diagonal.
2. A seeded generator for random patterns with roughly balanced ON/OFF pixels.
3. A function that flips a requested percentage of pixels using a seed.
4. Basic metadata: pattern ID, name, grid size, and number of active pixels.
Keep the visual patterns and random patterns in separate groups. Similar or mostly blank shapes can behave differently from balanced random patterns.
Don’t promise that any example will recall correctly yet. We’ll test that once Raghav’s engine is ready.
Put this in src/experiments and send me a small example showing how to load a pattern and generate a noisy copy.

What you should receive:
- Pattern fixtures.
- Seeded pattern/noise utilities.
- No charts yet.
2C. Assign the first research task to Amrit
Message to Amrit — Task 1
Hey Amrit, you’ll own the scientific explanation and our BDH connection.
Our live model is a classical Hopfield network. We need to explain it accurately and show how the idea of changing connection strengths relates to BDH, without pretending they are the same model.
Your first task is a short research note answering:
1. What is associative memory?
2. What changes when a Hopfield network stores a pattern?
3. How does recall work?
4. Why can memories interfere?
5. What related memory principle appears in BDH?
6. Where does the analogy stop?
Use primary papers and the official BDH material. For every important claim, include a source and section or equation where possible.
Please start with simple language. We need to teach this to people who don’t know neural networks.
Put the note in docs/research. Don’t build an agent, fine-tune a model, or add an LLM API—we don’t need those for the core project.

What you should receive:
- A short, sourced explanation.
- A clear list of claims we can and cannot make.
Step 3: While they work, you build the pattern editor
Your tasks, Indra
Build a reusable PatternGrid component.
It should support:
- Displaying an 8×8 pattern.
- Clicking cells to toggle them.
- Editable and read-only modes.
- Resetting the pattern.
- A visible keyboard focus state.
Then build:
1. A pattern gallery.
2. A Store Pattern button.
3. A list of stored patterns.
4. A way to choose one pattern as the intended recall target.
5. A separate copy called the cue, which users can damage.
Keep these separate:
Original pattern → retained for display/evaluation
Cue              → damaged copy given to the network
Changing the cue must not change the original.
Your checkpoint
Before moving forward, you should be able to:
- Draw a pattern.
- Save it in the application’s pattern list.
- Select it.
- Edit a separate copy.
This is only UI state so far. Neural storage gets connected next.
Step 4: Connect Raghav’s storage function
When Raghav sends his first PR:
1. Review the example.
2. Run the tests.
3. Merge it.
4. Connect Store Pattern to the storage function.
5. Display a simple weight-matrix preview.
Initially, even a small numeric table or debug panel is enough.
Message to Raghav — Task 2
The storage function is connected. Your next task is recall.
Please implement asynchronous updates: update one neuron at a time using the weighted sum of the other neurons.
Rules:
- Positive weighted input → +1.
- Negative weighted input → -1.
- Zero weighted input → keep the current value.
- A sweep means every neuron has been updated once.
- Stop when a complete sweep produces no changes, or when the maximum sweep count is reached.
Return the final state and a copied snapshot after every sweep so I can animate the real process.
The recall function must receive only the weights, damaged cue, seed, and settings. Do not pass the correct target pattern into it.
Please include tests and one example I can run from the UI. Keep it simple first; a Web Worker can come later.

What you should receive next:
- A working recall function.
- Actual intermediate states.
- A termination reason.
Step 5: Connect the first complete experiment
Once recall works, you integrate:
Select pattern
      ↓
Store it in weights
      ↓
Create noisy cue
      ↓
Run recall
      ↓
Display final state
Your tasks, Indra
- Add a noise slider using Nivedita’s utility.
- Connect Recall to Raghav’s engine.
- Show three grids:
  - Original
  - Damaged cue
  - Recalled output
- Add a Reset button.
- Deploy this basic working version.
First major milestone
You now have the core project.
It does not need polished charts or fancy animation yet.
Message to the whole team
Our first end-to-end version is live: [preview link].
Please test storing a pattern, corrupting it, and recalling it.
We’re checking whether the calculation and state flow are correct—not whether every pattern recalls successfully. Failure is expected in some cases.
Send me any bug with the pattern, settings, seed, and steps needed to reproduce it.

Step 6: Give Nivedita the real evaluation work
Message to Nivedita — Task 2
The engine is ready for experiments now.
Please use Raghav’s actual engine to measure results. Don’t write a separate model implementation.
Start with:
1. Exact recall: does every output cell match the target?
2. Cell accuracy: what fraction matches?
3. Overlap with each stored pattern.
4. Whether the engine reached a fixed point or hit the iteration limit.
5. Number of sweeps and computation time.
Then run two controlled experiments:
- Keep patterns fixed and increase noise.
- Keep the generation method fixed and increase memory load.
Use multiple seeds and targets. Record the configurations and sample counts.
Please identify one reliable success preset and one reliable failure preset for the guided demo. Label them as selected examples; we’ll also show aggregate results.
Send me the metric functions, result JSON, and instructions to reproduce the runs.

Your responsibility: Make sure these results come from the same engine version used by the website.
Step 7: Give Amrit the guided lesson
Send him the working preview and Nivedita’s verified presets.
Message to Amrit — Task 2
The live experiment is working. Please turn it into a short guided lesson.
Build these five steps:
1. Store a pattern and explain that connections changed.
2. Damage the cue.
3. Run recall and explain the observed result.
4. Add competing memories and show a verified failure.
5. Explain what this teaches about distributed memory.
For each step, write:
- One question for the learner.
- One action they should take.
- One short explanation after the computed result.
Use the verified presets from Nivedita rather than inventing outcomes.
Keep the language simple. Avoid saying recovery always works or that reaching a stable state means the answer is correct.
Build this inside src/sections/learn, using the shared grid and buttons. Tell me which events you need from the main application.

What you should receive:
- A working lesson component.
- Short instructional text.
- Clear event requirements such as “pattern stored” or “recall completed.”
Step 8: Add actual recall animation
Your tasks, Indra
Use the trace from Raghav’s engine to implement:
- Play.
- Pause.
- Next sweep.
- Previous recorded sweep.
- Restart playback.
- Playback speed.
Important: playback speed changes the viewing experience, not the mathematical result.
The animation must show recorded computed states—not morph one picture into another.
Message to Raghav — Task 3
Please add the inspection data we need for the microscope.
For a selected neuron update, we want to show:
- Previous state.
- Weighted input.
- New state.
Also calculate energy after each recorded sweep.
Add tests confirming energy does not increase, within numerical tolerance, for our supported symmetric asynchronous Hopfield model.
Please ensure snapshots don’t accidentally share the same mutable array.
After that, add a worker wrapper for longer runs and batch experiments. It should support run, progress, completion, error, and cancellation messages with a request ID.

Your responsibility: Connect the worker and ignore results belonging to an older cancelled experiment.
Step 9: Assign charts to Nivedita
Message to Nivedita — Task 3
Please build the visual analytics now that the metrics and traces exist.
We need three main charts:
1. Energy over recall sweeps.
2. Overlap with each stored pattern.
3. Exact recall rate versus noise or memory load.
The first two should use the current experiment’s actual trace. The aggregate chart can use your saved benchmark results, but it must say “precomputed experiment” and show sample count and configuration.
Add a short explanation below each chart. For example: “The state became stable, but it did not match the target.”
Please don’t call an output a ‘mixed memory’ just because it looks unusual. Show measured overlaps and use “unstored fixed point” when that is what we can establish.
Build the components in src/components/charts and send me example props so I can integrate them.

Step 10: Assign the BDH section to Amrit
Message to Amrit — Task 3
Please build the BDH section now.
It should answer: “What does the experiment we just performed help us understand about BDH?”
Include:
1. The shared idea of storing associations in changing connection state.
2. A source-backed BDH read/write diagram or equation.
3. What changes during inference versus what was learned during training.
4. A comparison showing why our Hopfield model is not BDH.
5. Sources beside the technical claims.
Please make this more than a text paragraph. A small inspectable numerical illustration or diagram would help, but label any simplification clearly.
Don’t claim that we reproduce BDH-CQ or the Sudoku benchmark. We are explaining a related mechanism, not recreating those systems.
Finish with one limitation and one question researchers are still investigating.

Step 11: Integrate everything into one journey
Your tasks, Indra
Combine the modules in this order:
1. Opening example: a computed recall preset.
2. Guided lesson: store, damage, recall, interfere.
3. Microscope: inspect weights, updates, energy, overlap.
4. Sandbox: draw custom patterns and change settings.
5. BDH connection: mechanism, differences, evidence.
6. Sources and limitations.
Do not create unrelated pages that each feel like a separate project.
Integration checklist
- Changing stored patterns rebuilds the relevant weights.
- Changing the cue clears stale results.
- Charts correspond to the displayed trace.
- The lesson uses real experiment events.
- Reset restores a known configuration.
- The correct answer is used only by evaluation/display.
- Errors and iteration limits are visible.
- Live versus precomputed results are labelled.
Step 12: Run a team review before adding features
Message to the whole team
We now have the complete core flow. Please stop adding new features for this review.
Everyone should try the application from beginning to end and report:
1. Anything mathematically wrong.
2. Anything confusing.
3. Anything that breaks when controls are used quickly.
4. Any claim we can’t support.
5. Anything missing from the hackathon requirements.
Send reproducible bugs rather than general comments like “not working.” Include steps, configuration, expected behaviour, and actual behaviour.

Assign focused reviews
Message to Raghav — Review
Please audit the engine and displayed numbers. Check that weights, updates, energy, convergence, and trace playback agree. Verify that the UI never substitutes a stored pattern for the actual recall output.

Message to Nivedita — Review
Please audit every metric and chart. Check labels, sample counts, seeds, selected examples, and whether high pixel accuracy is being confused with exact successful recall.

Message to Amrit — Review
Please read every sentence as a judge would. Flag unsupported claims, confusing terminology, overstated brain analogies, and any place where we blur Hopfield with BDH.

Your review
Test:
- Mobile layout.
- Keyboard navigation.
- Rapid control changes.
- Cancel/reset.
- Empty pattern list.
- Duplicate patterns.
- Reloading.
- Deployment.
- Broken links.
Step 13: Only now consider one optional enhancement
Do not automatically add everything.
Choose an enhancement only if the core is stable:
- A better neuron inspector.
- A pattern-correlation experiment.
- A separate fast-weight write-rule comparison.
My preference is the neuron inspector because it deepens the core demo without introducing a second model.
If you choose a delta-rule comparison, assign it to Raghav and Amrit together and clearly separate it from Hopfield dynamics. It must not delay documentation or submission.
Step 14: Assign the final documentation
Message to Raghav — Final documentation
Please write the technical implementation section:
- Pattern representation.
- Storage equation.
- Recall update.
- Tie handling.
- Convergence condition.
- Complexity.
- Supported limits.
- How to run the engine tests.
Keep it consistent with the actual code. Include one small hand-calculated example we can explain during judging.

Message to Nivedita — Final documentation
Please write the evaluation section:
- How patterns were generated.
- How noise was added.
- Which parameters were varied.
- Number of seeds and trials.
- Metric definitions.
- Main observations.
- Limitations.
- Commands/configurations needed to reproduce results.
Export the final charts and make sure every number matches the saved results.

Message to Amrit — Final documentation
Please draft the one-page concept summary and the research explanation.
Cover the central claim, mechanism, what the user can test, the BDH connection, recent primary sources, and limitations.
Coordinate with Nivedita for measured results and Raghav for equations. Don’t add numerical claims that they haven’t verified.
Also prepare the research-source list and help record any reused material and AI assistance.

Your final tasks, Indra
- Assemble the README.
- Add setup instructions.
- Add the architecture diagram.
- Verify licensing and acknowledgements.
- Export and inspect the required PDFs.
- Check the submission requirements against the brief.
- Confirm repository visibility and public URL.
- Run the production build and final smoke test.
- Keep a locally runnable backup.
Step 15: Prepare the judge demonstration
Use this sequence:
1. Store three patterns.
2. Damage one cue.
3. Run recall.
4. Inspect one actual neuron update.
5. Add competing memories.
6. Show a verified failure.
7. Show the corresponding metrics.
8. Explain the BDH connection and its limits.
Message to the whole team
Let’s rehearse the same demo until everyone can explain it.
Indra: introduce the problem and navigate the application.
Raghav: explain storage and one neuron update.
Nivedita: explain the failure and measured results.
Amrit: explain the BDH connection and what we are not claiming.
Everyone should also be able to explain the entire project at a basic level. We shouldn’t depend on one person being present to answer what the model does.

Your daily job as team leader
You do not need to understand every mathematical detail immediately. You need to keep work connected and verifiable.
At each checkpoint, ask everyone:
What works right now?
What can I test?
What are you blocked on?
What is your next small deliverable?

Maintain a simple tracker:
Task	Owner	Depends on	Done when
Repository and starter app	Indra	Nothing	Everyone runs it locally
Pattern fixtures and noise	Nivedita	Shared format	Seed reproduces the same cue
Hebbian storage	Raghav	Shared format	Small numerical tests pass
Recall engine	Raghav	Storage	Returns real trace and termination
First live experiment	Indra	Patterns + recall	Store → damage → recall works
Evaluation	Nivedita	Engine	Reproducible metrics and results
Guided lesson	Amrit	Verified experiments	User can complete the journey
Microscope and charts	Indra + Nivedita	Trace and metrics	Display matches computation
BDH section	Amrit	Sources	Accurate, substantive connection
Final testing	Everyone	Integrated app	No critical known defects
Submission	Indra coordinates	Tests + docs	Public app and complete package


Your immediate next move: initialize the repository, send the team-introduction message, and assign only the first three tasks—storage to Raghav, patterns/noise to Nivedita, and the research note to Amrit. While they work, you build the pattern editor.