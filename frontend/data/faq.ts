export interface FaqItem {
  question: string;
  answer: string;
}

/**
 * Questions and answers come from PRD 10.12. They are kept because each one
 * addresses a real concern specific to this product: whether LUMORA is a
 * crowdfunding platform, whether a legal entity is required, and what the AI
 * does and does not decide. A generic FAQ would damage trust more than no FAQ.
 */
export const faqItems: FaqItem[] = [
  {
    question: "Apa itu LUMORA?",
    answer:
      "LUMORA adalah platform digital pitching dan discovery yang membantu UMKM mempresentasikan bisnisnya dan ditemukan calon mitra atau pemodal.",
  },
  {
    question: "Apakah LUMORA platform crowdfunding?",
    answer:
      "Tidak. LUMORA tidak memproses transaksi investasi atau pembayaran.",
  },
  {
    question: "Apakah UMKM harus berbadan hukum?",
    answer:
      "Untuk konsep MVP, profil ditujukan agar bisnis mikro dan kecil dapat mulai mempresentasikan usahanya tanpa proses onboarding seberat platform pendanaan formal. Persyaratan final akan disesuaikan dengan kebijakan produk saat aplikasi production.",
  },
  {
    question: "Apa fungsi AI di LUMORA?",
    answer:
      "AI membantu menyusun draft profil, Business Model Canvas, serta merangkum informasi bisnis. Pengguna tetap dapat memeriksa dan mengedit hasil AI.",
  },
  {
    question: "Apakah LUMORA menentukan bisnis yang layak diinvestasikan?",
    answer:
      "Tidak. LUMORA menyediakan informasi dan alat bantu untuk proses discovery awal. Keputusan kerja sama tetap dilakukan oleh masing-masing pihak.",
  },
  {
    question: "Apakah menggunakan LUMORA gratis?",
    answer:
      "Untuk MVP, LUMORA dapat digunakan gratis untuk memulai. Detail harga final belum menjadi bagian dari halaman ini.",
  },
];
