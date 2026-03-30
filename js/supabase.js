const SUPABASE_URL = 'https://dqypnvrrmethwlzjebmg.supabase.co'
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxeXBudnJybWV0aHdsemplYm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NTU5MTgsImV4cCI6MjA5MDQzMTkxOH0.jNHr3eDA6bCxSUJh6oG3rcnAoJVWGQNJiQhAzKtESIE'

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_KEY)