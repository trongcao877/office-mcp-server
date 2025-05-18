/**
 * Công cụ để làm việc với Microsoft Graph API
 */

const { getGraphClient } = require('../middleware/auth');

/**
 * Lấy thông tin người dùng hiện tại
 */
const getCurrentUser = async () => {
  const graphClient = getGraphClient();
  
  try {
    const user = await graphClient
      .api('/me')
      .select('displayName,mail,userPrincipalName,id')
      .get();
    
    return user;
  } catch (error) {
    console.error('Lỗi lấy thông tin người dùng:', error);
    throw error;
  }
};

/**
 * Lấy danh sách tất cả các file trong OneDrive
 * @param {string} filter - Bộ lọc tùy chọn, ví dụ: fileExtension eq 'docx'
 */
const listFiles = async (filter = null) => {
  const graphClient = getGraphClient();
  
  try {
    let query = graphClient.api('/me/drive/root/children');
    
    if (filter) {
      query = query.filter(filter);
    }
    
    const response = await query.get();
    return response.value;
  } catch (error) {
    console.error('Lỗi lấy danh sách files:', error);
    throw error;
  }
};

/**
 * Tìm kiếm file theo từ khóa trong OneDrive
 * @param {string} searchTerm - Từ khóa tìm kiếm
 */
const searchFiles = async (searchTerm) => {
  const graphClient = getGraphClient();
  
  try {
    const response = await graphClient
      .api(`/me/drive/root/search(q='${searchTerm}')`)
      .get();
    
    return response.value;
  } catch (error) {
    console.error('Lỗi tìm kiếm files:', error);
    throw error;
  }
};

/**
 * Tạo file mới trong OneDrive
 * @param {string} name - Tên file
 * @param {string} fileType - Loại file (docx, xlsx, pptx)
 * @param {Buffer|string} content - Nội dung file (tùy chọn)
 */
const createFile = async (name, fileType, content = null) => {
  const graphClient = getGraphClient();
  
  try {
    // Kiểm tra và thêm phần mở rộng file nếu cần
    if (!name.endsWith(`.${fileType}`)) {
      name = `${name}.${fileType}`;
    }
    
    // Tạo file rỗng
    const driveItem = await graphClient
      .api('/me/drive/root/children')
      .post({
        name: name,
        file: {}
      });
    
    // Nếu có nội dung, cập nhật nội dung file
    if (content) {
      await graphClient
        .api(`/me/drive/items/${driveItem.id}/content`)
        .put(content);
    }
    
    return driveItem;
  } catch (error) {
    console.error('Lỗi tạo file:', error);
    throw error;
  }
};

/**
 * Cập nhật nội dung file
 * @param {string} fileId - ID của file
 * @param {Buffer|string} content - Nội dung mới
 */
const updateFileContent = async (fileId, content) => {
  const graphClient = getGraphClient();
  
  try {
    await graphClient
      .api(`/me/drive/items/${fileId}/content`)
      .put(content);
    
    return { success: true };
  } catch (error) {
    console.error('Lỗi cập nhật nội dung file:', error);
    throw error;
  }
};

/**
 * Xóa file
 * @param {string} fileId - ID của file
 */
const deleteFile = async (fileId) => {
  const graphClient = getGraphClient();
  
  try {
    await graphClient
      .api(`/me/drive/items/${fileId}`)
      .delete();
    
    return { success: true };
  } catch (error) {
    console.error('Lỗi xóa file:', error);
    throw error;
  }
};

module.exports = {
  getCurrentUser,
  listFiles,
  searchFiles,
  createFile,
  updateFileContent,
  deleteFile
};