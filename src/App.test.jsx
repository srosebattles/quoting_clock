import { render, screen } from '@testing-library/react';
import App from './App';

const mockQuotesCSV = (csvText) => {
  global.fetch = vi.fn().mockResolvedValue({ text: () => Promise.resolve(csvText) });
};

afterEach(() => {
  delete global.fetch;
});

test('renders the heading and the PG-13 toggle', async () => {
  mockQuotesCSV('');
  render(<App />);

  expect(screen.getByRole('heading', { name: /quoting clock/i })).toBeInTheDocument();
  expect(await screen.findByRole('button', { name: /show pg-13 quotes/i })).toBeInTheDocument();
});

test('shows the current time when no quote matches', async () => {
  mockQuotesCSV('');
  render(<App />);

  expect(await screen.findByText(/there's no quote to display/i)).toBeInTheDocument();
});

test('shows a quote matching the current time, with the time phrase highlighted', async () => {
  const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  mockQuotesCSV(`${currentTime}|the witching hour|It was the witching hour, as usual.|A Test Book|A. Author|sfw`);
  render(<App />);

  expect(await screen.findByText(/as usual/)).toBeInTheDocument();
  expect(screen.getByText('the witching hour').tagName).toBe('STRONG');
  expect(screen.getByText('A Test Book')).toBeInTheDocument();
  expect(screen.getByText(/A\. Author/)).toBeInTheDocument();
});
