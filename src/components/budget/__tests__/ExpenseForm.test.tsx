import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { addBudgetExpense } from "@/actions/budget.actions";
import { ExpenseForm } from "../ExpenseForm";

vi.mock("@/actions/budget.actions", () => ({
  addBudgetExpense: vi.fn(),
}));

const mockedAdd = vi.mocked(addBudgetExpense);
const ACCOUNT = "account-1";

function succeed() {
  // biome-ignore lint/suspicious/noExplicitAny: the form only reads success
  mockedAdd.mockResolvedValue({ success: true, data: null, error: null } as any);
}

function amountField() {
  return screen.getByPlaceholderText("0,00");
}

function submitButton() {
  return screen.getByRole("button", { name: /adicionar gasto/i });
}

beforeEach(() => {
  vi.clearAllMocks();
  succeed();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("logging an expense takes one number", () => {
  it("should submit with only the amount filled in", async () => {
    render(<ExpenseForm accountId={ACCOUNT} />);

    fireEvent.change(amountField(), { target: { value: "42" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(mockedAdd).toHaveBeenCalledTimes(1));
    expect(mockedAdd).toHaveBeenCalledWith(
      ACCOUNT,
      expect.objectContaining({ amount: 42, category: "Outros" }),
    );
  });

  it("should accept a comma as the decimal separator", async () => {
    render(<ExpenseForm accountId={ACCOUNT} />);

    fireEvent.change(amountField(), { target: { value: "12,50" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(mockedAdd).toHaveBeenCalledTimes(1));
    expect(mockedAdd.mock.calls[0][1].amount).toBe(12.5);
  });

  it("should refuse letters in the amount", () => {
    render(<ExpenseForm accountId={ACCOUNT} />);

    fireEvent.change(amountField(), { target: { value: "abc12" } });

    expect(amountField()).toHaveValue("12");
  });

  it("should keep the button disabled until there is an amount", () => {
    render(<ExpenseForm accountId={ACCOUNT} />);

    expect(submitButton()).toBeDisabled();

    fireEvent.change(amountField(), { target: { value: "10" } });

    expect(submitButton()).toBeEnabled();
  });

  it("should reject zero instead of sending it", async () => {
    render(<ExpenseForm accountId={ACCOUNT} />);

    fireEvent.change(amountField(), { target: { value: "0" } });
    fireEvent.click(submitButton());

    expect(await screen.findByText("Digite um valor valido")).toBeInTheDocument();
    expect(mockedAdd).not.toHaveBeenCalled();
  });

  it("should clear the amount after a successful entry", async () => {
    render(<ExpenseForm accountId={ACCOUNT} />);

    fireEvent.change(amountField(), { target: { value: "30" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(amountField()).toHaveValue(""));
  });

  it("should show the server error instead of pretending it worked", async () => {
    mockedAdd.mockResolvedValue({
      success: false,
      data: null,
      error: "Sem conexao",
      // biome-ignore lint/suspicious/noExplicitAny: partial response is enough
    } as any);

    render(<ExpenseForm accountId={ACCOUNT} />);
    fireEvent.change(amountField(), { target: { value: "30" } });
    fireEvent.click(submitButton());

    expect(await screen.findByText("Sem conexao")).toBeInTheDocument();
  });
});

describe("choosing a category", () => {
  it("should send the category the user picked", async () => {
    render(<ExpenseForm accountId={ACCOUNT} />);

    fireEvent.click(screen.getByText("Alimentacao"));
    fireEvent.change(amountField(), { target: { value: "80" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(mockedAdd).toHaveBeenCalledTimes(1));
    expect(mockedAdd.mock.calls[0][1].category).toBe("Alimentacao");
  });

  it("should default to Outros when nothing is picked", async () => {
    render(<ExpenseForm accountId={ACCOUNT} />);

    fireEvent.change(amountField(), { target: { value: "5" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(mockedAdd).toHaveBeenCalledTimes(1));
    expect(mockedAdd.mock.calls[0][1].category).toBe("Outros");
  });
});

describe("logging an expense from another day", () => {
  it("should send the chosen date when it is not today", async () => {
    render(<ExpenseForm accountId={ACCOUNT} selectedDate="2026-09-01" />);

    fireEvent.change(amountField(), { target: { value: "25" } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(mockedAdd).toHaveBeenCalledTimes(1));
    expect(mockedAdd.mock.calls[0][1].date).toBe("2026-09-01");
  });

  it("should warn that the entry is retroactive", () => {
    render(<ExpenseForm accountId={ACCOUNT} selectedDate="2026-09-01" />);

    fireEvent.click(screen.getByText("Mais detalhes"));

    expect(screen.getByText(/Lancamento retroativo/)).toBeInTheDocument();
  });

  it("should not warn when the selected day is today", () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2026, 8, 2, 10, 0, 0));

    render(<ExpenseForm accountId={ACCOUNT} selectedDate="2026-09-02" />);
    fireEvent.click(screen.getByText("Mais detalhes"));

    expect(screen.queryByText(/Lancamento retroativo/)).toBeNull();
  });

  it("should follow the day the user selects on the week strip", () => {
    const { rerender } = render(
      <ExpenseForm accountId={ACCOUNT} selectedDate="2026-09-02" />,
    );

    rerender(<ExpenseForm accountId={ACCOUNT} selectedDate="2026-08-31" />);
    fireEvent.click(screen.getByText("Mais detalhes"));

    expect(screen.getByDisplayValue("2026-08-31")).toBeInTheDocument();
  });
});

describe("late night entries", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it("should treat 22:00 in Brazil as today, not tomorrow", () => {
    // toISOString() would answer 2026-09-03 here, because 22:00 in Brasilia is
    // already past midnight UTC. The server records the expense on the 2nd, so
    // the form has to agree with it.
    vi.setSystemTime(new Date(2026, 8, 2, 22, 30, 0));

    render(<ExpenseForm accountId={ACCOUNT} />);
    fireEvent.click(screen.getByText("Mais detalhes"));

    expect(screen.getByDisplayValue("2026-09-02")).toBeInTheDocument();
    expect(screen.queryByText(/Lancamento retroativo/)).toBeNull();
  });

  it("should not mark a late night entry as retroactive", async () => {
    vi.setSystemTime(new Date(2026, 8, 2, 23, 45, 0));

    render(<ExpenseForm accountId={ACCOUNT} />);
    fireEvent.change(amountField(), { target: { value: "18" } });
    fireEvent.click(submitButton());

    await vi.waitFor(() => expect(mockedAdd).toHaveBeenCalledTimes(1));
    // date stays undefined, so the server files it under its own today.
    expect(mockedAdd.mock.calls[0][1].date).toBeUndefined();
  });
});
