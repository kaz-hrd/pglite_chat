import { PGlite } from "@electric-sql/pglite";
import { vector } from "@electric-sql/pglite/vector";
import { Params } from "./Const";

class DataBase {
  private static instance: PGlite;
  private constructor() {}
  public static async getInstance(): Promise<PGlite> {
    if (!DataBase.instance) {
      DataBase.instance = await PGlite.create(
        'idb://pgdata',
        {
          extensions: { vector },
        }
      );
      await DataBase.instance.exec("CREATE EXTENSION IF NOT EXISTS vector;");
      await DataBase.instance.exec(`
        CREATE TABLE IF NOT EXISTS vec_tbl (
            id SERIAL PRIMARY KEY,
            content TEXT NOT NULL,
            embedding vector(${Params.dimensionSize}) NOT NULL
        );
        CREATE INDEX ON vec_tbl USING hnsw (embedding vector_cosine_ops);
      `);
    }
    return DataBase.instance;
  }
}
export default DataBase;