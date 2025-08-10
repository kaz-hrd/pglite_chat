import { useState, type ChangeEvent } from 'react'
import { Container, Typography, TextField, Button, Box, CircularProgress, Alert } from '@mui/material'
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material'
import { EmbedContentResponse, GoogleGenAI } from "@google/genai";
import { Params } from './Const';
import DataBase from './DataBase';

export default function Embedding() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [search, setSearch] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [results, setResults] = useState<Array<{ [key: string]: any }>>([])

  const apiKey = sessionStorage.getItem('apiKey') || ''
  const ai = new GoogleGenAI({apiKey: apiKey});

  // ファイル選択時の処理
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null)
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setInput('') // テキスト入力をクリア
    }
  }

  // 検索処理
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!search.trim()) return
    const response = await embed(search);
    if (response && response.embeddings && response.embeddings.length > 0) {
      const vec = JSON.stringify(response.embeddings[0].values);
      const pg = await DataBase.getInstance();
      const rs = await pg.exec(`
                          SELECT
                            content,
                            embedding <-> '${vec}' AS distance
                          FROM vec_tbl
                          ORDER BY distance ASC
                          LIMIT 5;`)

      setResults(rs[0].rows)
    }
  }
  
  const embed = async (text: string): Promise<EmbedContentResponse | undefined> => {
    if (!text.trim()) return undefined;
    const response = await ai.models.embedContent({
        model: Params.embeddingModel,
        contents: [ text ],
        config: {
          outputDimensionality: Params.dimensionSize,
        }
    });
    return response;
  }
  const insertEmbedding = async (text: string) => {
    const response = await embed(text);
    if (response && response.embeddings && response.embeddings.length > 0) {
      const vec = JSON.stringify(response.embeddings[0].values);
      const pg = await DataBase.getInstance();
      await pg.exec(`INSERT INTO vec_tbl (content, embedding) VALUES ('${text}', '${vec}');`);
    } else {
      console.error('Embedding failed or no embeddings returned');
    }
  }
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    let text = input
    if (file) {
      try {
        text = await file.text()
      } catch (err: unknown) {
        let msg = '不明'
        if (err instanceof Error) msg = err.message
        setErrorMsg('ファイルの読み込みに失敗しました :' + msg)
        setLoading(false)
        return
      }
    }
    if (!text.trim()) {
      setErrorMsg('テキストまたはファイル内容が空です')
      setLoading(false)
      return
    }
    setInput('')
    setFile(null)
    try {
      await insertEmbedding(text)
    } catch (err: unknown) {
      let msg = '不明'
      if (err instanceof Error) msg = err.message
      setErrorMsg(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>Insert vector</Typography>
      {errorMsg && <Alert severity="error" sx={{ mb: 2 }}>{errorMsg}</Alert>}
      <Box component="form" onSubmit={handleSend} display="flex" gap={2}>
        <TextField
          value={input}
          onChange={e => { setInput(e.target.value); setFile(null); }}
          label="メッセージを入力"
          variant="outlined"
          fullWidth
          autoComplete="off"
          disabled={loading || !!file}
          multiline
          minRows={3}
        />
        <input
          type="file"
          onChange={handleFileChange}
          disabled={loading || !!input}
          style={{ alignSelf: 'center' }}
        />
        <Button type="submit" variant="contained" color="primary" disabled={loading || (!input.trim() && !file)}>
          送信
        </Button>
      </Box>
      <Box component="form" onSubmit={handleSearch} display="flex" gap={2} mb={2}>
        <TextField
          value={search}
          onChange={e => setSearch(e.target.value)}
          label="登録内容検索"
          variant="outlined"
          fullWidth
          autoComplete="off"
        />
        <Button type="submit" variant="outlined" color="primary" disabled={!search.trim()}>
          検索
        </Button>
      </Box>
      {/* 検索結果表示 */}
      {results.length > 0 && (
        <Box mb={2}>
          <Typography variant="h6">検索結果</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>内容</TableCell>
                  <TableCell>距離</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.content}</TableCell>
                    <TableCell>{row.distance !== undefined ? row.distance : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}
      {loading && <Box mt={2} textAlign="center"><CircularProgress /></Box>}
      {!apiKey && <Typography color="error" mt={2}>APIキーが設定されていません。Setupページで設定してください。</Typography>}
    </Container>
  )
}
