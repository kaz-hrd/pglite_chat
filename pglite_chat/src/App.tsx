import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AppBar, Toolbar, Button, Container, Typography } from '@mui/material'
import ChatPage from './ChatPage'
import Setup from './Setup'
import SqlPage from './SqlPage'
import Embedding from './Embedding'

function App() {
  return (
    <BrowserRouter>
      <Container maxWidth="xl" disableGutters sx={{ minHeight: '100vh', px: 0 }}>
        <AppBar position="static">
          <Toolbar>
            <Button color="inherit" component={Link} to="/">チャット</Button>
            <Button color="inherit" component={Link} to="/setup">設定</Button>
            <Button color="inherit" component={Link} to="/sql">SQL</Button>
            <Button color="inherit" component={Link} to="/embedding">Embedding</Button>
            <Button color="inherit" component={Link} to="/about">About</Button>
          </Toolbar>
        </AppBar>
        <Typography variant="h3" gutterBottom>
          クライアントサイドでチャット
        </Typography>
        <Routes>
          <Route
            path="/"
            element={<ChatPage />}
          />
          <Route
            path="/about"
            element={
              <div>
                <Typography variant="h5">About Page</Typography>
                <Button variant="outlined" href="/">
                  Back to Home
                </Button>
              </div>
            }
          />
          <Route path="/setup" element={<Setup />} />
          <Route
            path="/sql"
            element={<SqlPage />}
          />
          <Route path="/embedding" element={<Embedding />} />
        </Routes>
      </Container>
    </BrowserRouter>
  )
}

export default App
