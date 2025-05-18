const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../../middleware/auth');

// Mock để giả lập đối tượng req, res và next
const mockRequest = (headers) => ({
  headers: headers || {}
});

const mockResponse = () => {
  const res = {};
  res.sendStatus = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

// Mock cho thư viện jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 401 if no token is provided', () => {
    const req = mockRequest();
    const res = mockResponse();

    authenticateToken(req, res, mockNext);

    expect(res.sendStatus).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 403 if token is invalid', () => {
    const req = mockRequest({ authorization: 'Bearer invalid_token' });
    const res = mockResponse();

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(new Error('Invalid token'), null);
    });

    authenticateToken(req, res, mockNext);

    expect(res.sendStatus).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should call next() if token is valid', () => {
    const userInfo = { id: '123', username: 'testuser' };
    const req = mockRequest({ authorization: 'Bearer valid_token' });
    const res = mockResponse();

    jwt.verify.mockImplementation((token, secret, callback) => {
      callback(null, userInfo);
    });

    authenticateToken(req, res, mockNext);

    expect(res.sendStatus).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toEqual(userInfo);
  });
});