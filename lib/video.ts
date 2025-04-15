export const saveVideoLocally = async (file: File, mediaId: string) => {
  // Создаем URL для файла
  const videoUrl = URL.createObjectURL(file);
  // Сохраняем в localStorage
  localStorage.setItem(`video_${mediaId}`, videoUrl);
  return videoUrl;
};

export const getVideoUrl = (mediaId: string) => {
  return localStorage.getItem(`video_${mediaId}`);
};
