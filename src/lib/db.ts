import Dexie, { type Table } from 'dexie'

export interface WatchlistEntry {
  id?: number
  symbol: string
  name: string
  sector: string
  lockedPrice: number
  lockedDate: string // ISO date, the day tracking started
}

class MultibaggerDB extends Dexie {
  watchlist!: Table<WatchlistEntry, number>

  constructor() {
    super('multibagger-db')
    this.version(1).stores({
      watchlist: '++id, symbol',
    })
  }
}

export const db = new MultibaggerDB()
