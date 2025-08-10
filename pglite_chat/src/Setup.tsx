import { useForm } from 'react-hook-form'
import { Button, Container, Typography, TextField, Box, Alert } from '@mui/material'
import { useEffect, useState } from 'react'

interface FormData {
  apiKey: string
}

export default function Setup() {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>()
  const [message, setMessage] = useState('')

  useEffect(() => {
    const storedKey = sessionStorage.getItem('apiKey')
    if (storedKey) {
      setValue('apiKey', storedKey)
    }
  }, [setValue])

  const onSubmit = (data: FormData) => {
    sessionStorage.setItem('apiKey', data.apiKey)
    setMessage('APIキーを保存しました')
  }

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>設定</Typography>
      {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
      <Box component="form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="APIキー"
          variant="outlined"
          fullWidth
          margin="normal"
          autoComplete="off"
          {...register('apiKey', { required: 'APIキーは必須です' })}
          error={!!errors.apiKey}
          helperText={errors.apiKey?.message}
        />
        <Button type="submit" variant="contained" color="primary">
          設定
        </Button>
      </Box>
    </Container>
  )
}
