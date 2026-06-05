import { useState, useMemo, Fragment, useEffect } from 'react';
import { AppLayout } from '@/components/app-layout';
import { Search, Download, ChevronDown, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

type LogEntry = {
  id: number;
  sessionId: string;
  domain: string | null;
  eventType: string;
  score: number | null;
  verdict: string | null;
  country: string | null;
  durationMs: number | null;
  userAgent: string | null;
  referrer: string | null;
  createdAt: string;
  tokenId: string;
};

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerdict, setFilterVerdict] = useState('all');
  const [filterEvent, setFilterEvent] = useState('all');
  const [pageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await api.dashboard.logs(200, 0);
        setLogs(data.logs || []);
        setTotal(data.total || 0);
        setError('');
      } catch (e: any) {
        setError(e.message || 'Failed to load logs');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (filterVerdict !== 'all' && log.verdict !== filterVerdict) return false;
      if (filterEvent !== 'all' && log.eventType !== filterEvent) return false;
      if (
        searchQuery &&
        !log.sessionId.includes(searchQuery) &&
        !(log.domain || '').includes(searchQuery) &&
        !log.eventType.includes(searchQuery)
      )
        return false;
      return true;
    });
  }, [logs, searchQuery, filterVerdict, filterEvent]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const uniqueEvents = Array.from(new Set(logs.map((l) => l.eventType)));

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatFull = (iso: string) => {
    return new Date(iso).toISOString().slice(0, 19).replace('T', ' ');
  };

  return (
    <AppLayout>
      <div className="p-4 md:p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Log Explorer</h1>
            <p className="text-muted-foreground text-sm">
              {loading ? 'Loading...' : `${total} total events`}
            </p>
          </div>
          <button
            onClick={() => {
              const csv = [
                'Timestamp,Session ID,Domain,Event,Score,Verdict,Country,Duration',
                ...filtered.map((l) =>
                  [formatFull(l.createdAt), l.sessionId, l.domain || '', l.eventType, l.score?.toFixed(3) || '', l.verdict || '', l.country || '', l.durationMs ? `${l.durationMs}ms` : ''].join(',')
                ),
              ].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' });
              const a = document.createElement('a');
              a.href = URL.createObjectURL(blob);
              a.download = 'poh-logs.csv';
              a.click();
            }}
            className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md text-sm font-medium hover:bg-secondary"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <div className="bg-card border border-border rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search session, domain, event..."
              className="w-full bg-secondary border border-border rounded-md pl-9 pr-3 py-2 text-sm outline-none focus:border-primary"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <select
            className="bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none"
            value={filterEvent}
            onChange={(e) => {
              setFilterEvent(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Events</option>
            {uniqueEvents.map((ev) => (
              <option key={ev} value={ev}>
                {ev}
              </option>
            ))}
          </select>
          <select
            className="bg-secondary border border-border rounded-md px-3 py-2 text-sm outline-none"
            value={filterVerdict}
            onChange={(e) => {
              setFilterVerdict(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Verdicts</option>
            <option value="HUMAN">HUMAN</option>
            <option value="BOT">BOT</option>
            <option value="CAPTCHA">CAPTCHA</option>
          </select>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterVerdict('all');
              setFilterEvent('all');
              setCurrentPage(1);
            }}
            className="text-sm font-medium text-muted-foreground hover:text-foreground px-2 py-2"
          >
            Clear
          </button>
        </div>

        <div className="flex justify-between items-center mb-2 text-sm text-muted-foreground">
          <div>
            {filtered.length === 0
              ? 'No results'
              : `Showing ${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}`}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/10 border-b border-border text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Timestamp</th>
                    <th className="px-4 py-3 font-medium">Session ID</th>
                    <th className="px-4 py-3 font-medium hidden md:table-cell">Domain</th>
                    <th className="px-4 py-3 font-medium hidden sm:table-cell">Event</th>
                    <th className="px-4 py-3 font-medium">Score</th>
                    <th className="px-4 py-3 font-medium">Verdict</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Country</th>
                    <th className="px-4 py-3 font-medium hidden lg:table-cell">Duration</th>
                    <th className="px-4 py-3 font-medium w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center text-muted-foreground text-sm">
                        {total === 0
                          ? 'No events yet. Send your first beacon via the ingest endpoint.'
                          : 'No matching events.'}
                      </td>
                    </tr>
                  ) : (
                    pageItems.map((log) => (
                      <Fragment key={log.id}>
                        <tr
                          className="cursor-pointer hover:bg-secondary/20 border-b border-border/40 transition-colors"
                          onClick={() => setExpandedRow(expandedRow === log.id ? null : log.id)}
                        >
                          <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{formatTime(log.createdAt)}</td>
                          <td className="px-4 py-3 text-xs font-mono">{log.sessionId.slice(0, 12)}...</td>
                          <td className="px-4 py-3 text-sm hidden md:table-cell">{log.domain || '—'}</td>
                          <td className="px-4 py-3 text-sm hidden sm:table-cell">{log.eventType}</td>
                          <td
                            className={`px-4 py-3 text-sm font-medium ${
                              (log.score ?? 1) < 0.3
                                ? 'text-red-400'
                                : (log.score ?? 1) < 0.7
                                ? 'text-yellow-400'
                                : 'text-green-400'
                            }`}
                          >
                            {(log.score ?? 0).toFixed(3)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                log.verdict === 'HUMAN'
                                  ? 'bg-green-500/20 text-green-500'
                                  : log.verdict === 'BOT'
                                  ? 'bg-red-500/20 text-red-500'
                                  : 'bg-yellow-500/20 text-yellow-500'
                              }`}
                            >
                              {log.verdict ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">{log.country || '—'}</td>
                          <td className="px-4 py-3 text-sm text-muted-foreground hidden lg:table-cell">
                            {log.durationMs ? `${Math.round(log.durationMs)}ms` : '—'}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">
                            {expandedRow === log.id ? (
                              <ChevronDown className="w-4 h-4" />
                            ) : (
                              <ChevronRight className="w-4 h-4" />
                            )}
                          </td>
                        </tr>
                        {expandedRow === log.id && (
                          <tr>
                            <td colSpan={9} className="px-4 py-3 bg-muted/5 border-b border-border">
                              <div className="rounded-lg p-4 bg-background grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Full Timestamp</div>
                                  <div className="text-sm font-mono">{formatFull(log.createdAt)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Session ID</div>
                                  <div className="text-sm font-mono break-all">{log.sessionId}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Referrer</div>
                                  <div className="text-sm truncate">{log.referrer || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground mb-1">Risk Level</div>
                                  <div className="text-sm">
                                    {(log.score ?? 1) < 0.3 ? 'High' : (log.score ?? 1) < 0.7 ? 'Medium' : 'Low'}
                                  </div>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <button
                                  className="px-3 py-1.5 text-xs font-medium border border-border hover:bg-secondary rounded-md transition-colors"
                                  onClick={() => navigator.clipboard.writeText(log.sessionId)}
                                >
                                  Copy Session ID
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border bg-secondary/50 hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
              let pageNum = currentPage;
              if (currentPage < 3) pageNum = i + 1;
              else if (currentPage > totalPages - 2) pageNum = totalPages - 4 + i;
              else pageNum = currentPage - 2 + i;

              if (pageNum < 1 || pageNum > totalPages) return null;

              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-8 h-8 flex items-center justify-center rounded-md border border-border bg-secondary/50 hover:bg-secondary disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
