import { prisma } from "..";
import jwt from "jsonwebtoken";

export function register(req: any, res: any) {
  const { email, password, username, bio = "", name}: any = req.body;
  const user : any = prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (user) {
    return res.json({ message: "Email already exists" });
  }

  const userWithUserName : any = prisma.user.findUnique({
    where: {
      username,
    },
  });
  if (userWithUserName) {
    return res.json({ message: "UserName already exists" });
  }
  
  const newUser:any = prisma.user.create({
    data: {
      email,
      password,
      username
    }
  })

  const token = jwt.sign({ id: newUser.id, username: newUser.username, email: newUser.email }, process.env.JWT_SECRET as string);
  res.json({ token });
}


export function login(req: any, res: any) {
  const { email, password }: any = req.body;
  const user : any = prisma.user.findUnique({
    where: {
      email,
    },
  });
  if (!user) {
    return res.json({ message: "User not found" });
  }

  if (user.password !== password) {
    return res.json({ message: "Invalid password" });
  }

  const token = jwt.sign({  id: user.id, username: user.username, email: user.email }, process.env.JWT_SECRET as string);
  res.json({ token });
}