import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import NewsletterSignup from '../components/Newsletter'
import Pricing from '../components/Pricing'
import Header from '../components/Header'
import Footer from '../components/Footer'

const LandingPage = () => {
  return (
    <div>
      <main className='flex flex-col flex-grow gap-20 lg:gap-30 justify-center items-center px-2 md:px-20 py-5'>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        {/* <div /> */}
        <NewsletterSignup />
      </main>
    </div>
  )
}

export default LandingPage