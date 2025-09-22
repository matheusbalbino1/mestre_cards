import { DatabaseStatus, initializeDatabase } from "@/lib/db"
import { DB_CONFIG } from "@/lib/db/config"
import { SQLiteProvider } from "expo-sqlite"
import { createContext, useContext, useMemo } from "react"
import { Subject } from "rxjs"

interface DBContextType {
  databaseStatus$: Subject<DatabaseStatus>
}

const DBContext = createContext<DBContextType | null>(null)

export const DBProvider = ({ children }: { children: React.ReactNode }) => {
  const databaseStatus$ = useMemo(() => new Subject<DatabaseStatus>(), [])

  return (
    <SQLiteProvider
      databaseName={DB_CONFIG.name}
      onInit={async (db) => {
        await initializeDatabase(db, databaseStatus$)
      }}
    >
      <DBContext.Provider
        value={{
          databaseStatus$,
        }}
      >
        {children}
      </DBContext.Provider>
    </SQLiteProvider>
  )
}

export const useDB = () => {
  const context = useContext(DBContext)
  if (!context) {
    throw new Error("useDB must be used within a DBProvider")
  }
  return context
}
