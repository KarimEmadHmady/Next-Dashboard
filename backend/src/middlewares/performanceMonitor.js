// Performance monitoring middleware
// استخدم هذا في server.js لمراقبة الأداء

export const performanceMonitor = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const url = req.path;
    const status = res.statusCode;
    
    // تحذير إذا كان الـ response بطيء
    if (duration > 2000) {
      console.warn(`⚠️  SLOW ENDPOINT - ${status} ${method} ${url} - ${duration}ms`);
    } else if (duration > 1000) {
      console.log(`🐢 Moderate - ${status} ${method} ${url} - ${duration}ms`);
    } else {
      console.log(`✅ Fast - ${status} ${method} ${url} - ${duration}ms`);
    }
    
    // يمكنك إضافة logging لـ database
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};
