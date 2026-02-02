// ============================================
// CONFIG.JS - Credenciais Globais do TuneCraft
// ============================================
// Este arquivo contém configurações compartilhadas
// entre dashboard.html, chat.js e checkout.html

const SUPABASE_URL = "https://miupzfchvfbqbznfhvix.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pdXB6ZmNodmZicWJ6bmZodml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxOTYwNzksImV4cCI6MjA4NDc3MjA3OX0.rz0W9qVovRvAeyBQ55LRewOAOM5a8pNJs1-UwWttATw";
const STRIPE_PUBLIC_KEY = "pk_test_51StZvo1wgBnYhkbFGEWUqMCIhCzXBCzUrDxypLj7ge0InE6ZlQj4QXWHPmljSyaLqaC4hNxZvA0oZ4PWCEh6FJj10072HL9w8v";

// Mercado Pago (coloque sua Public Key aqui)
const MERCADOPAGO_PUBLIC_KEY = "APP_USR-8ec47a84-e54f-46da-8455-9e6ac0f1031e";

// Evita redeclaração se já estiver carregado
if (!window.TUNECRAFT_CONFIG_LOADED) {
  window.TUNECRAFT_CONFIG_LOADED = true;
}
