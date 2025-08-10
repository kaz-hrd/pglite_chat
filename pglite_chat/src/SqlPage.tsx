import { Repl } from "@electric-sql/pglite-repl";
import DataBase from './DataBase';
import { useEffect, useState } from "react";
import type { PGlite } from "@electric-sql/pglite";

export default function SqlPage() {
  const [dataBase, setDataBase] = useState<PGlite>();
  useEffect(() => {
      const init = async () => {
        const db = await DataBase.getInstance();
        setDataBase(db);
      }
      init();
  }, []);
  return (
    <>
      <h2>PGlite SQL tool</h2>
      { dataBase ? <Repl pg={dataBase} /> : <p>Loading...</p> }
    </>
  );
}
