export interface LeaderboardEntry {
    name: string,
    address: string,
    positive: number,
    negative: number,
    neutral: number,
    score: number;
    rank?: number;
}
export interface LeaderboardEntryId {
    id: string;
    score: number;
    rank?: number;
}
