import { useState, useEffect } from 'react'
import { Plus, Box, IceCream, Pencil, Trash2, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  getCategories, createCategory,
  getProducts, createProduct, updateProduct, deleteProduct,
  getBoxes, createBox, updateBox, deleteBox
} from '../api/inventory'

// ===== MODAL COMPONENT =====
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center p-5 border-b">
        <h3 className="text-lg font-bold text-pink-600">{title}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
)

// ===== CATEGORY MODAL =====
const CategoryModal = ({ onClose, onSave }) => {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return toast.error('Category name is required')
    setLoading(true)
    try {
      const res = await createCategory(name.trim())
      onSave(res.data)
      toast.success('Category added!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error adding category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Add New Category" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Cone, Sundae, Stick"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" disabled={loading}
            className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
            {loading ? 'Adding...' : 'Add Category'}
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
            Cancel
          </button>
        </div>
      </form>
    </Modal>
  )
}

// ===== PRODUCT MODAL =====
const ProductModal = ({ product, categories, onClose, onSave }) => {
  const [form, setForm] = useState({
    categoryId: product?.categoryId || '',
    size: product?.size || '',
    flavor: product?.flavor || '',
    price: product?.price || '',
    quantity: product?.quantity || ''
  })
  const [loading, setLoading] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [cats, setCats] = useState(categories)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.categoryId || !form.size || !form.flavor || !form.price || form.quantity === '') {
      return toast.error('All fields are required')
    }
    setLoading(true)
    try {
      let res
      if (product) {
        res = await updateProduct(product.id, form)
        toast.success('Product updated!')
      } else {
        res = await createProduct(form)
        toast.success('Product added!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Modal title={product ? 'Edit Product' : 'Add New Product'} onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="flex gap-2">
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
              >
                <option value="">Select Category</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowCategoryModal(true)}
                className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
                + Add New
              </button>
            </div>
          </div>

          {['size', 'flavor'].map(field => (
            <div className="mb-4" key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
              <input
                type="text"
                value={form[field]}
                onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                placeholder={field === 'size' ? 'e.g., 100ml, 500ml, Standard' : 'e.g., Vanilla, Chocolate'}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
              />
            </div>
          ))}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              placeholder="Price per unit"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
            <input
              type="number"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              placeholder="Stock quantity"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
              {loading ? 'Saving...' : 'Save Product'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onSave={(newCat) => {
            setCats([...cats, newCat])
            setForm({ ...form, categoryId: newCat.id })
          }}
        />
      )}
    </>
  )
}

// ===== BOX MODAL =====
const BoxModal = ({ box, categories, onClose, onSave }) => {
  const [form, setForm] = useState({
    categoryId: box?.categoryId || '',
    size: box?.size || '',
    quantityPerBox: box?.quantityPerBox || ''
  })
  const [loading, setLoading] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [cats, setCats] = useState(categories)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.categoryId || !form.size || !form.quantityPerBox) {
      return toast.error('All fields are required')
    }
    setLoading(true)
    try {
      let res
      if (box) {
        res = await updateBox(box.id, form)
        toast.success('Box updated!')
      } else {
        res = await createBox(form)
        toast.success('Box added!')
      }
      onSave(res.data)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving box')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Modal title={box ? 'Edit Box' : 'Add New Box'} onClose={onClose}>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <div className="flex gap-2">
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
              >
                <option value="">Select Category</option>
                {cats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="button" onClick={() => setShowCategoryModal(true)}
                className="bg-gray-700 hover:bg-gray-800 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap">
                + Add New
              </button>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
            <input
              type="text"
              value={form.size}
              onChange={(e) => setForm({ ...form, size: e.target.value })}
              placeholder="e.g., 100ml, 500ml, Standard"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantity per Box</label>
            <input
              type="number"
              value={form.quantityPerBox}
              onChange={(e) => setForm({ ...form, quantityPerBox: e.target.value })}
              placeholder="How many fit in one box"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
            />
            <p className="text-xs text-gray-500 mt-1">Number of ice creams that fit in one box</p>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading}
              className="flex-1 bg-pink-600 hover:bg-pink-700 text-white py-2 rounded-lg font-medium transition">
              {loading ? 'Saving...' : 'Save Box'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-medium transition">
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {showCategoryModal && (
        <CategoryModal
          onClose={() => setShowCategoryModal(false)}
          onSave={(newCat) => {
            setCats([...cats, newCat])
            setForm({ ...form, categoryId: newCat.id })
          }}
        />
      )}
    </>
  )
}

// ===== MAIN INVENTORY PAGE =====
export default function Inventory() {
  const [view, setView] = useState('products') // 'products' or 'boxes'
  const [products, setProducts] = useState([])
  const [boxes, setBoxes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [modal, setModal] = useState(null) // null | 'addProduct' | 'editProduct' | 'addBox' | 'editBox'
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [prodRes, boxRes, catRes] = await Promise.all([
        getProducts(),
        getBoxes(),
        getCategories()
      ])
      setProducts(prodRes.data.sort((a, b) => 
        a.category.name.localeCompare(b.category.name)
      ))
      setBoxes(boxRes.data)
      setCategories(catRes.data)
    } catch (err) {
      toast.error('Error loading data')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    const catRes = await getCategories()
    setCategories(catRes.data)
  }

  // Find box config for a product
  const getBoxConfig = (product) => {
    return boxes.find(b =>
      b.categoryId === product.categoryId && b.size === product.size
    )
  }

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchCat = !filterCategory || p.categoryId === parseInt(filterCategory)
    const matchSearch = !search || p.flavor.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return
    try {
      await deleteProduct(id)
      setProducts(products.filter(p => p.id !== id))
      toast.success('Product deleted')
    } catch {
      toast.error('Error deleting product')
    }
  }

  const handleDeleteBox = async (id) => {
    if (!confirm('Delete this box configuration?')) return
    try {
      await deleteBox(id)
      setBoxes(boxes.filter(b => b.id !== id))
      toast.success('Box deleted')
    } catch {
      toast.error('Error deleting box')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-pink-600 text-lg">Loading...</div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <h2 className="text-3xl font-bold text-pink-600">Ice Cream<br />Inventory</h2>
        <button
          onClick={() => { setSelected(null); setModal(view === 'products' ? 'addProduct' : 'addBox') }}
          className="bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-medium flex items-center gap-2 transition"
        >
          <Plus size={18} />
          {view === 'products' ? 'Add New Product' : 'Add New Box'}
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500"
        >
          <option value="">Select Category</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <div className="flex-1 relative min-w-48">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by flavor..."
            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-pink-500"
          />
        </div>

        <button
          onClick={() => setView(view === 'products' ? 'boxes' : 'products')}
          className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
        >
          {view === 'products' ? <><Box size={16} /> Box</> : <><IceCream size={16} /> Products</>}
        </button>
      </div>

      {/* Products Table */}
      {view === 'products' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {['Category', 'Size', 'Flavor', 'Price', 'Quantity', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    No products found. Add your first product!
                  </td>
                </tr>
              ) : filteredProducts.map(product => {
                const boxConfig = getBoxConfig(product)
                return (
                  <tr key={product.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-700">{product.category.name}</td>
                    <td className="px-4 py-3 text-gray-700">{product.size}</td>
                    <td className="px-4 py-3 text-gray-700">{product.flavor}</td>
                    <td className="px-4 py-3 text-gray-700">₹{product.price}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={product.quantity === 0 ? 'text-red-500 font-bold' : 'text-gray-700'}>
                            {product.quantity}
                            {product.quantity === 0 && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-1">
                                    Out of Stock
                                </span>
                            )}
                            {product.quantity > 0 && product.quantity <= 10 && (
                                <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full ml-1">
                                    Low Stock
                                </span>
                            )}
                        </span>
                        {boxConfig && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Box: {boxConfig.quantityPerBox} units
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelected(product); setModal('editProduct') }}
                          className="text-pink-600 hover:text-pink-700 p-1 rounded transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-500 hover:text-red-600 p-1 rounded transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* Box Configuration Table */}
      {view === 'boxes' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-gray-700">Box Configuration</h3>
            <button
              onClick={() => { setSelected(null); setModal('addBox') }}
              className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm transition"
            >
              <Plus size={16} /> Add New Box
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  {['Category', 'Size', 'Quantity per Box', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-sm font-semibold text-gray-600">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {boxes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-gray-400">
                      No box configurations found.
                    </td>
                  </tr>
                ) : boxes.map(box => (
                  <tr key={box.id} className="border-b hover:bg-gray-50 transition">
                    <td className="px-4 py-3 text-gray-700">{box.category.name}</td>
                    <td className="px-4 py-3 text-gray-700">{box.size}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-700">{box.quantityPerBox}</span>
                      <span className="text-gray-500 text-sm"> units per box</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setSelected(box); setModal('editBox') }}
                          className="text-pink-600 hover:text-pink-700 p-1 rounded transition"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBox(box.id)}
                          className="text-red-500 hover:text-red-600 p-1 rounded transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {(modal === 'addProduct' || modal === 'editProduct') && (
        <ProductModal
          product={modal === 'editProduct' ? selected : null}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={(saved) => {
            if (modal === 'editProduct') {
              setProducts(products.map(p => p.id === saved.id ? saved : p))
            } else {
              setProducts([...products, saved])
            }
            setModal(null)
          }}
        />
      )}

      {(modal === 'addBox' || modal === 'editBox') && (
        <BoxModal
          box={modal === 'editBox' ? selected : null}
          categories={categories}
          onClose={() => setModal(null)}
          onSave={(saved) => {
            if (modal === 'editBox') {
              setBoxes(boxes.map(b => b.id === saved.id ? saved : b))
            } else {
              setBoxes([...boxes, saved])
            }
            setModal(null)
          }}
        />
      )}
    </div>
  )
}