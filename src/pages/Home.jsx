import Banner from '../components/Banner'
import Output from '../components/Output'
import { useGeminiContext } from '../context/useGeminiContext'
import TypingLoader from '../components/TypingLoader'

const Home = () => {
  const { loading } = useGeminiContext();
  return (
    <div>
      <main className='flex flex-col flex-grow gap-20 justify-center items-center px-5 md:px-20 py-5'>
        <Banner />
        {/* {loading && <TypingLoader />} */}
        <Output />
      </main>
    </div>
  )
}

export default Home