import { Route, Routes } from 'react-router-dom'
import { FileProvider } from './store/fileStore'
import Layout from './layout/Layout'
import HomePage from './pages/HomePage'
import EditPage from './pages/EditPage'

function App() {
  return (
    <FileProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/edit" element={<EditPage />} />
        </Routes>
      </Layout>
    </FileProvider>
  )
}

export default App
