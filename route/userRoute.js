import { Router } from 'express';
import { registerUserController, loginUserController, logoutUserController} from '../controllers/userControllers.js';

const userRouter = Router();

userRouter.post('/register', registerUserController);
userRouter.post('/login', loginUserController);
userRouter.post('/logout', logoutUserController);
// userRouter.post('/auth/verify-email', verifyEmailController);

export default userRouter; 