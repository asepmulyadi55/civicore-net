import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { ConfirmModal } from '../../admin/components/ui';

function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/30 rounded-xl flex items-center gap-3">
      <span className="material-icons text-emerald-500">check_circle</span>
      <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">{message}</p>
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-900/30 rounded-xl flex items-center gap-3">
      <span className="material-icons text-rose-500">error</span>
      <p className="text-sm text-rose-700 dark:text-rose-400 font-medium">{message}</p>
    </div>
  );
}

export default function Navigation() {
  const { t } = useTranslation();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const showSuccess = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3000); };
  const showError = (msg) => { setErrorMsg(msg); setTimeout(() => setErrorMsg(''), 3000); };

  const [formData, setFormData] = useState({
    title: '',
    url: '',
    showInNavigation: true,
    showInFooter: true,
    order: 0
  });

  const [deleteModal, setDeleteModal] = useState({ open: false, id: null, title: '', loading: false });

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/navigation');
      setLinks(res.data.data);
    } catch (err) {
      showError('Failed to load navigation links');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (link = null) => {
    if (link) {
      setEditingId(link.id);
      setFormData({
        title: link.title,
        url: link.url,
        showInNavigation: link.showInNavigation,
        showInFooter: link.showInFooter,
        order: link.order
      });
    } else {
      setEditingId(null);
      setFormData({
        title: '',
        url: '',
        showInNavigation: true,
        showInFooter: true,
        order: links.length + 1
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`/api/navigation/${editingId}`, formData);
        showSuccess('Navigation link updated successfully');
      } else {
        await axios.post('/api/navigation', formData);
        showSuccess('Navigation link created successfully');
      }
      handleCloseModal();
      fetchLinks();
    } catch (err) {
      showError('Failed to save navigation link');
    }
  };

  const handleDelete = async () => {
    setDeleteModal(d => ({ ...d, loading: true }));
    try {
      await axios.delete(`/api/navigation/${deleteModal.id}`);
      showSuccess('Navigation link deleted');
      fetchLinks();
    } catch (err) {
      showError('Failed to delete link');
    }
    setDeleteModal({ open: false, id: null, title: '', loading: false });
  };

  const moveItem = async (index, direction) => {
    if (direction === -1 && index === 0) return;
    if (direction === 1 && index === links.length - 1) return;

    const items = [...links];
    const item = items[index];
    items.splice(index, 1);
    items.splice(index + direction, 0, item);

    const updatedItems = items.map((itm, idx) => ({ ...itm, order: idx + 1 }));
    setLinks(updatedItems);

    try {
      await Promise.all(updatedItems.map(itm => 
        axios.put(`/api/navigation/${itm.id}`, {
          title: itm.title,
          url: itm.url,
          showInNavigation: itm.showInNavigation,
          showInFooter: itm.showInFooter,
          order: itm.order
        })
      ));
      showSuccess('Navigation order updated');
    } catch (err) {
      showError('Failed to update order');
      fetchLinks();
    }
  };

  if (loading) {
    return <div className="p-6 text-center"><span className="material-icons animate-spin text-4xl text-primary">autorenew</span></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end mb-4">
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer whitespace-nowrap"
        >
          <span className="material-icons text-[18px]">add</span> {t('homepage.text_add_link', 'Add Link')}
        </button>
      </div>

      <SuccessBanner message={successMsg} />
      <ErrorBanner message={errorMsg} />

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-x-auto">
        <table className="w-full text-left min-w-[600px]">
          <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('homepage.label_order', 'Order')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('homepage.label_title', 'Title')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('homepage.label_url', 'URL')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('homepage.label_show_in_nav', 'Show In Nav')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase">{t('homepage.label_show_in_footer', 'Show In Footer')}</th>
              <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase text-right">{t('homepage.label_actions', 'Actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
            {links.map((link, index) => (
              <tr
                key={link.id}
                className="hover:bg-slate-50 dark:hover:bg-slate-700/50 bg-white dark:bg-slate-800"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-1 text-slate-400">
                    <button onClick={() => moveItem(index, -1)} disabled={index === 0} className={`cursor-pointer hover:text-primary ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`}>
                      <span className="material-icons text-lg">arrow_upward</span>
                    </button>
                    <button onClick={() => moveItem(index, 1)} disabled={index === links.length - 1} className={`cursor-pointer hover:text-primary ${index === links.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`}>
                      <span className="material-icons text-lg">arrow_downward</span>
                    </button>
                    <span className="ml-2 font-medium text-slate-700 dark:text-slate-300">{link.order}</span>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{link.title}</td>
                <td className="px-6 py-4 text-slate-500">{link.url}</td>
                <td className="px-6 py-4">
                  {link.showInNavigation ? (
                    <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">{t('homepage.label_yes', 'Yes')}</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded-full font-medium">{t('homepage.label_no', 'No')}</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {link.showInFooter ? (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">{t('homepage.label_yes', 'Yes')}</span>
                  ) : (
                    <span className="bg-slate-100 text-slate-800 text-xs px-2 py-1 rounded-full font-medium">{t('homepage.label_no', 'No')}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleOpenModal(link)}
                    className="text-primary hover:text-primary-dark mr-3 cursor-pointer"
                    title="Edit"
                  >
                    <span className="material-icons">edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteModal({ open: true, id: link.id, title: link.title, loading: false })}
                    className="text-red-500 hover:text-red-700 cursor-pointer"
                    title="Delete"
                  >
                    <span className="material-icons">delete</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        
        {links.length === 0 && (
          <div className="p-8 text-center text-slate-500">
            {t('homepage.text_no_navigation_links_found_click_add_link_to_create_one', 'No navigation links found. Click "Add Link" to create one.')}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                {editingId ? t('homepage.edit_link', 'Edit Link') : t('homepage.add_link', 'Add Link')}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <span className="material-icons">close</span>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('homepage.label_title', 'Title')}</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                  placeholder={t('homepage.placeholder_e_g_about_us', 'e.g. About Us')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('homepage.text_url_path', 'URL / Path')}</label>
                <input
                  type="text"
                  required
                  value={formData.url}
                  onChange={e => setFormData({...formData, url: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-slate-900 dark:text-white"
                  placeholder={t('homepage.placeholder_e_g_about_or_about', 'e.g. /about or /#about')}
                />
                <p className="text-xs text-slate-500 mt-1">{t('homepage.text_for_anchor_links_on_homepage_use_section_e_g_properties_for_separate_pages_use_page_e_g_gallery', 'For anchor links on homepage, use /#section (e.g. /#properties). For separate pages, use /page (e.g. /gallery).')}</p>
              </div>

              <div className="flex items-center space-x-3 pt-2">
                <input
                  type="checkbox"
                  id="showInNav"
                  checked={formData.showInNavigation}
                  onChange={e => setFormData({...formData, showInNavigation: e.target.checked})}
                  className="w-4 h-4 text-primary bg-slate-50 border-slate-300 rounded focus:ring-primary"
                />
                <label htmlFor="showInNav" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('homepage.text_show_in_top_navigation', 'Show in Top Navigation')}
                </label>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="showInFooter"
                  checked={formData.showInFooter}
                  onChange={e => setFormData({...formData, showInFooter: e.target.checked})}
                  className="w-4 h-4 text-primary bg-slate-50 border-slate-300 rounded focus:ring-primary"
                />
                <label htmlFor="showInFooter" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  {t('homepage.text_show_in_footer_quick_links', 'Show in Footer Quick Links')}
                </label>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-white/5 mt-4">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-2.5 rounded-xl font-bold border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1B2236] transition-colors cursor-pointer"
                >
                  {t('homepage.text_cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-primary hover:opacity-90 text-white dark:text-surface text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] hover:shadow-md transition-all duration-200 cursor-pointer"
                >
                  {editingId ? t('homepage.text_save_changes', 'Save Changes') : t('homepage.text_create_link', 'Create Link')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        open={deleteModal.open} 
        onClose={() => setDeleteModal({ open: false, id: null, title: '', loading: false })}
        onConfirm={handleDelete} 
        loading={deleteModal.loading} 
        icon="delete_outline"
        title={t('homepage.label_delete_link', 'Delete Link?')} 
        message={<>{t('homepage.text_are_you_sure_you_want_to_delete', 'Are you sure you want to delete')} <strong>{deleteModal.title}</strong>? {t('homepage.msg_cannot_be_undone', 'This cannot be undone.')}</>} 
        confirmLabel={t('homepage.text_yes_delete', 'Yes, Delete')} 
      />
    </div>
  );
}
