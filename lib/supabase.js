const { createClient } = require('@supabase/supabase-js');

// 環境変数からSupabaseの接続情報を読み込む
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL と SUPABASE_ANON_KEY を .env に設定してください');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
