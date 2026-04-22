import { useState } from 'react';
import { BookOpen, Search, Info } from 'lucide-react';

const TERMS = [
  {
    name: 'PPF (Public Provident Fund)',
    emoji: '🏛️',
    category: 'Government Scheme',
    meaning: 'Ye sarkar ki ek super-safe "Gullak" hai. Isme aap saal ka ₹500 se lekar ₹1.5 lakh tak daal sakte ho.',
    example: 'Jaise lambe safar ke liye gaadi mein extra stepney (tyre) rakhte hain, PPF aapke future ki stepney hai. Ye 15 saal ke liye lock ho jata hai, is par byaaj (interest) bahut achha milta hai aur sabse badhiya baat — is par ₹1 ka bhi Tax nahi lagta!',
    meaning_en: 'This is a super-safe government "piggy bank". You can invest from ₹500 up to ₹1.5 lakh annually.',
    example_en: 'Just like keeping a spare tire for a long journey, PPF is the spare tire for your future. Locked for 15 years, gives great interest, and 100% Tax-Free!'
  },
  {
    name: 'NSC (National Savings Certificate)',
    emoji: '📜',
    category: 'Government Scheme',
    meaning: 'Isey aap Post Office ki 5 saal wali FD samajh lo.',
    example: 'Aap ek baar paisa lagate ho aur 5 saal baad byaaj ke sath wapas milta hai. Agar aapko Income Tax (Section 80C) bachana hai aur market ka risk nahi lena, toh NSC ekdum best aur safe option hai.',
    meaning_en: 'Think of this as a 5-year Fixed Deposit from the Post Office.',
    example_en: 'You invest once and get it back with interest after 5 years. Best for saving Income Tax (Section 80C) without market risk.'
  },
  {
    name: 'SSY (Sukanya Samriddhi Yojana)',
    emoji: '👧',
    category: 'Government Scheme',
    meaning: 'Beti ki padhai aur shadi ke liye sarkar ki khaas scheme.',
    example: 'Agar aapke ghar mein 10 saal se choti beti hai, toh aap ye account khulwa sakte hain. Sarkar isme doosri schemes ke mukable sabse zyada byaaj (interest) deti hai taaki jab wo badi ho toh paise ki koi tension na ho.',
    meaning_en: 'A special government scheme for a daughter\'s education and marriage.',
    example_en: 'If you have a daughter under 10, you can open this. The government gives the highest interest so money won\'t be a problem when she grows up.'
  },
  {
    name: 'SCSS (Senior Citizen Savings Scheme)',
    emoji: '👴',
    category: 'Government Scheme',
    meaning: '60 saal se upar ke logon (Dada-Dadi, Nana-Nani) ke liye safe aamdani.',
    example: 'Retirement ke baad jab salary aana band ho jati hai, toh log apna paisa SCSS mein daal dete hain. Isse unhe har 3 mahine mein pension ki tarah byaaj (pocket money) milta rehta hai.',
    meaning_en: 'Safe income scheme for senior citizens (above 60 years).',
    example_en: 'After retirement when the salary stops, people put money in SCSS. It gives them interest (like pocket money) every 3 months.'
  },
  {
    name: 'MIS (Post Office Monthly Income Scheme)',
    emoji: '💌',
    category: 'Government Scheme',
    meaning: 'Ek baar paisa dalo aur har mahine fixed income (byaaj) lete raho.',
    example: 'Agar aapke paas lamba paisa ikattha rakha hai aur aap chahte ho ki us paise se aapki har mahine ki aamdani ban jaye bina us paise ko kam kiye, toh MIS best hai. Ye har mahine aapko ek fix pocket money deta hai.',
    meaning_en: 'Invest a lump sum once and get fixed income (interest) every month.',
    example_en: 'If you have a large amount saved and want a monthly income without reducing the main amount, MIS is the best. It acts like monthly pocket money.'
  },
  {
    name: 'RD (Recurring Deposit)',
    emoji: '📮',
    category: 'Bank/Post Office',
    meaning: 'Har mahine thoda-thoda paisa bank mein fix karna.',
    example: 'Jaise har mahine phone ka recharge, Netflix ka bill ya loan ki EMI aati hai, RD bhi ek "Ameer Banne Ki EMI" hai. Aap bank ko bolte ho ki har mahine meri aamdani se ₹1000 nikal kar 5 saal tak save kar do aur uspe byaaj do.',
    meaning_en: 'Saving a fixed small amount in the bank every month.',
    example_en: 'Like your monthly Netflix bill or phone recharge, RD is an "EMI to become rich". Bank deducts a fixed amount every month for 5 years and gives interest.'
  },
  {
    name: 'FD (Fixed Deposit)',
    emoji: '🏦',
    category: 'Bank/Post Office',
    meaning: 'Bank ki ek aisi tijori jisme paisa ek fix time ke liye lock hota hai.',
    example: 'Agar aapke paas ₹10,000 hain aur agle 1 saal tak unka koi kaam nahi hai, toh unhe FD mein daal do. Bank aapko guarantee deta hai ki 1 saal baad aapko guarantee ke sath extra paise milenge. Market chahe crash ho jaye, FD ka paisa 100% safe rehta hai.',
    meaning_en: 'A bank safe where money is locked for a fixed time.',
    example_en: 'If you have ₹10,000 and don\'t need it for 1 year, put it in FD. The bank guarantees extra money after 1 year. Even if the market crashes, FD is 100% safe.'
  },
  {
    name: 'SIP (Systematic Investment Plan)',
    emoji: '🌱',
    category: 'Market Investment',
    meaning: 'SIP ka seedha sa matlab hai — "Ameer banne ki EMI" ya "Smart Gullak"! Har mahine ek fix amount automatically invest karna.',
    example: 'Sochiye bachpan mein aapke paas mitti ki ek "Gullak" thi jisme aap roz ₹10 daalte the. SIP aaj ke zamaane ki wahi Gullak hai. Farak sirf itna hai ki SIP wali gullak mein "Market Experts" baithe hain jo aapke paise ko achhi companies mein lagate hain jisse aapko Compounding (byaaj par byaaj) ka jaadu milta hai.',
    meaning_en: 'SIP simply means — "EMI to get rich" or a "Smart Piggy Bank"! Auto-investing a fixed amount monthly.',
    example_en: 'Like dropping ₹10 daily in your childhood piggy bank. In SIP, "Market Experts" invest your piggy bank money in good companies, giving you the magic of Compounding.'
  },
  {
    name: 'Mutual Funds',
    emoji: '📈',
    category: 'Market Investment',
    meaning: 'Market ke experts ko apna paisa dena taaki wo usey aage badha sakein.',
    example: 'Aapko car chalani nahi aati par Delhi jana hai, toh aap Bus lete ho jise ek Expert Driver chalata hai. Mutual Fund bhi waise hi hai. Aapka aur hazaron logon ka paisa ek Financial Expert (Driver) share market mein lagata hai.',
    meaning_en: 'Giving your money to market experts so they can grow it.',
    example_en: 'If you don\'t know how to drive but need to go to Delhi, you take a Bus driven by an Expert. Mutual funds are similar; an expert drives your money in the share market.'
  },
  {
    name: 'SGB (Sovereign Gold Bond)',
    emoji: '🥇',
    category: 'Gold',
    meaning: 'Paper wala Sona (Digital Gold) jise khud Bharat Sarkar deti hai.',
    example: 'Sona kharidoge toh chori ka darr aur banwane ke charges lagenge. SGB mein aap paper/digital form mein sona kharidte ho. Sone ka rate badhne ka fayda toh milta hi hai, plus sarkar isme aapko har saal 2.5% extra byaaj (interest) alag se deti hai!',
    meaning_en: 'Paper gold (Digital Gold) issued directly by the Government of India.',
    example_en: 'Buying physical gold has making charges and theft risks. SGB is digital. You get the benefit of gold price rise, PLUS the government pays 2.5% extra interest every year!'
  }
];

export default function FinanceGlossary() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTerms = TERMS.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.meaning.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" /> Asaan Bhasha Mein Finance (Glossary)
          </h2>
          <p className="text-gray-400 text-sm mt-1">Mushkil financial terms ko real-life examples se samjhein.</p>
        </div>
        <div className="relative">
          <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search karo (e.g. PPF, FD, Sona)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 input w-full md:w-72 bg-gray-900 border-gray-700 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Terms List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTerms.map((term, index) => (
          <div key={index} className="card border border-gray-800 hover:border-gray-600 transition-colors space-y-3">
            <div className="flex items-start justify-between border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>{term.emoji}</span> {term.name}
              </h3>
              <span className="text-xs font-medium px-2 py-1 bg-gray-800 text-gray-400 rounded-full">{term.category}</span>
            </div>
            <p className="text-blue-300 text-sm font-medium leading-relaxed">
              <span className="text-blue-400 font-bold">Matlab:</span> {term.meaning}
            </p>
            <div className="bg-gray-800/50 p-3 rounded-xl flex items-start gap-2 text-sm text-gray-300 leading-relaxed">
              <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p><span className="text-emerald-400 font-bold">Example:</span> {term.example}</p>
            </div>
          </div>
        ))}
        {filteredTerms.length === 0 && (
          <div className="col-span-1 md:col-span-2 text-center py-10 text-gray-500">
            Arey! Ye term abhi dictionary mein nahi hai. Dobara search karein.
          </div>
        )}
      </div>
    </div>
  );
}