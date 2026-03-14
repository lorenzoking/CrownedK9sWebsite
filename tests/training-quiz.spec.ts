import { expect, test } from "@playwright/test";

async function answerQuestion(page, answer: string) {
  await page.getByRole("button", { name: answer, exact: true }).click();
}

async function answerMainIssues(page, issues: string[]) {
  for (const issue of issues) {
    await page.getByRole("button", { name: issue, exact: true }).click();
  }

  await page.getByRole("button", { name: "Continue", exact: true }).click();
}

test.describe("training program finder", () => {
  test("training page CTA opens the dedicated quiz page", async ({ page }) => {
    await page.goto("/training");

    await expect(
      page.getByRole("heading", { name: "Not sure which training program you need?" })
    ).toBeVisible();

    await page.getByRole("link", { name: "Find My Dog's Program" }).click();

    await expect(page).toHaveURL(/\/find-my-dogs-program\/?$/);
    await expect(
      page.getByRole("heading", { name: "Not sure which training program you need?" })
    ).toBeVisible();
    await expect(page.locator("[data-quiz-progress-label]")).toHaveText("Question 1 of 5");
  });

  test("puppy answers recommend the puppy package", async ({ page }) => {
    await page.goto("/find-my-dogs-program");
    const quizSection = page.locator("#find-my-dogs-program");

    await answerQuestion(page, "Puppy (under 6 months)");
    await answerMainIssues(page, ["Puppy issues (biting, potty, crate, chewing)"]);
    await answerQuestion(
      page,
      "I can commit to daily practice and want to be very involved in the process."
    );
    await answerQuestion(page, "Busy family or kids in the home");
    await answerQuestion(page, "It's more of an annoyance than an emergency");

    await expect(quizSection.getByText("Recommended Program:")).toBeVisible();
    await expect(
      quizSection.getByRole("heading", { name: "3-4 Session Puppy Training Package" }).first()
    ).toBeVisible();
    await expect(
      quizSection.getByText("Transformation Training Package could also be a fit.")
    ).toBeVisible();
  });

  test("urgent aggression with trainer-heavy support recommends academy", async ({ page }) => {
    await page.goto("/find-my-dogs-program");
    const quizSection = page.locator("#find-my-dogs-program");

    await answerQuestion(page, "Adult (18+ months)");
    await answerMainIssues(page, [
      "Pulling on leash / not listening",
      "Aggression or safety concerns"
    ]);
    await answerQuestion(
      page,
      "I can practice a few times a week, but I'd like a trainer to do the heavy lifting and show me how to maintain it."
    );
    await answerQuestion(page, "Apartment or close neighbors");
    await answerQuestion(
      page,
      "It feels urgent and we're worried about safety or big problems later"
    );

    await expect(
      quizSection.getByRole("heading", { name: "Crowned K9s Academy Board & Train" })
    ).toBeVisible();
    await expect(
      quizSection.getByText("Transformation Training Package could also be a fit.")
    ).toBeVisible();
  });

  test("low urgency, high involvement answers keep single session secondary only", async ({
    page
  }) => {
    await page.goto("/find-my-dogs-program");
    const quizSection = page.locator("#find-my-dogs-program");

    await answerQuestion(page, "Adolescent (6-18 months)");
    await answerMainIssues(page, ["Pulling on leash / not listening"]);
    await answerQuestion(
      page,
      "I can commit to daily practice and want to be very involved in the process."
    );
    await answerQuestion(page, "House with a yard");
    await answerQuestion(page, "It's more of an annoyance than an emergency");

    await expect(
      quizSection.getByRole("heading", { name: "Transformation Training Package" }).first()
    ).toBeVisible();
    await expect(
      quizSection.getByText(
        "If you feel confident with training and just want expert eyes and a live demonstration for this one specific issue, a"
      )
    ).toBeVisible();
    await expect(
      quizSection.getByRole("link", { name: "Single Private Session" })
    ).toBeVisible();
  });

  test("multiple non-safety issues still recommend transformation when structure is needed", async ({
    page
  }) => {
    await page.goto("/find-my-dogs-program");
    const quizSection = page.locator("#find-my-dogs-program");

    await answerQuestion(page, "Adult (18+ months)");
    await answerMainIssues(page, [
      "Pulling on leash / not listening",
      "Barking or reactivity around people/dogs"
    ]);
    await answerQuestion(
      page,
      "I can commit to daily practice and want to be very involved in the process."
    );
    await answerQuestion(page, "Multi-dog household");
    await answerQuestion(page, "It's getting stressful and we need real change");

    await expect(
      quizSection.getByRole("heading", { name: "Transformation Training Package" }).first()
    ).toBeVisible();
    await expect(quizSection.getByText("Recommended Program:")).toBeVisible();
  });
});
