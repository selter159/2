const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch'); // Import node-fetch cho CommonJS

// Cấu hình Supabase client
const supabaseUrl = 'https://sptquxjgnjywspcngtdu.supabase.co';
const supabaseKey = 'sb_secret_8TgIdDaap5ZQuzy6cazDew_5hE1vVKd';
const supabase = createClient(supabaseUrl, supabaseKey, {
  global: { fetch } // Truyền fetch trực tiếp, không cần .bind()
});

// Hàm kiểm tra kết nối
async function testConnection() {
  try {
    const { data, error } = await supabase.from('links').select('*').limit(1);
    if (error) throw error;
    console.log('Kết nối thành công, dữ liệu mẫu:', data);
  } catch (error) {
    console.error('Lỗi kết nối:', error.message);
  }
}

testConnection();