import { useState, useRef } from 'react'
import { Container, Typography, TextField, Button, Box, CircularProgress, Stack, Paper } from '@mui/material'
import { EmbedContentResponse, GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { Params } from './Const';
import DataBase from './DataBase';

interface Message {
  role: 'user' | 'ai'
  text: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  const apiKey = sessionStorage.getItem('apiKey') || ''
  const ai = new GoogleGenAI({apiKey: apiKey});
  const chatClient = ai.chats.create({
    model: Params.model
  });

  const searchDatabase = async (text: string): Promise<string> => {
    if (!text.trim()) return ''
    const response = await embed(text);
    if (response && response.embeddings && response.embeddings.length > 0) {
      const vec = JSON.stringify(response.embeddings[0].values);
      const pg = await DataBase.getInstance();
      const rs = await pg.exec(`
                          SELECT
                            content,
                            embedding <-> '${vec}' AS distance
                          FROM vec_tbl
                          ORDER BY distance ASC
                          LIMIT 2;`)
      if (rs[0]?.rows?.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return rs[0].rows.map((row: { [key: string]: any; }) => row.content).join('\n');
      }
    }
    return '';
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

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || !chatClient) return
    const userMsg: Message = { role: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)
    try {
      // RAG: データベース検索
      const searchResults = await searchDatabase(input);

      // AIへのプロンプトに検索結果を追加
      let prompt: string;
      if(searchResults){
        prompt = `以下は関連する情報です:\n${searchResults}\n\nユーザーの質問: ${input}`;
      }else{
        prompt = input
      }

      const result = await chatClient.sendMessage({message: prompt});
      const aiMsg: Message = { role: 'ai', text: result.text ? result.text : '応答がありませんでした' }
      setMessages(prev => [...prev, aiMsg])
    } catch (err: unknown) {
      let errorMsg = '不明';
      if (err instanceof Error) {
        errorMsg = err.message;
      }
      setMessages(prev => [...prev, { role: 'ai', text: 'エラー: ' + errorMsg }])
    } finally {
      setLoading(false)
      setTimeout(() => {
        if (listRef.current) {
          listRef.current.scrollTop = listRef.current.scrollHeight
        }
      }, 100)
    }
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" gutterBottom>Gemini AI Chat</Typography>
      <Box sx={{ width: '100%', maxHeight: 500, overflow: 'auto', mb: 2, bgcolor: '#f5f5f5', borderRadius: 2, p: 2 }} ref={listRef}>
        <Stack spacing={2}>
          {messages.map((msg, i) => (
            <Paper
              key={i}
              elevation={2}
              sx={{
                p: 2,
                bgcolor: msg.role === 'user' ? '#e3f2fd' : '#fff',
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                ml: msg.role === 'user' ? 'auto' : 0,
              }}
            >
              <Typography variant="caption" color="textSecondary">
                {msg.role === 'user' ? 'あなた' : 'Gemini AI'}
              </Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}><ReactMarkdown>{msg.text}</ReactMarkdown></Typography>
            </Paper>
          ))}
        </Stack>
      </Box>
      <Box component="form" onSubmit={handleSend} display="flex" gap={2}>
        <TextField
          value={input}
          onChange={e => setInput(e.target.value)}
          label="メッセージを入力"
          variant="outlined"
          fullWidth
          autoComplete="off"
          disabled={loading}
          multiline
          minRows={3}
        />
        <Button type="submit" variant="contained" color="primary" disabled={loading || !input.trim()}>
          送信
        </Button>
      </Box>
      {loading && <Box mt={2} textAlign="center"><CircularProgress /></Box>}
      {!apiKey && <Typography color="error" mt={2}>APIキーが設定されていません。Setupページで設定してください。</Typography>}
    </Container>
  )
}
