import { Role } from 'src/users/role.enum';
import { Column, CreateDateColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export class SignupDto {
        @PrimaryGeneratedColumn()
        id: number;
    
        @Column({ unique: true })
        email: string;
    
        @Column()
        firstName: string;
    
        @Column()
        lastName: string;
    
        @Column()
        password: string;
    
        @Column({ type: 'enum', enum: Role, default: Role.USER })
        role: Role;
    
        @CreateDateColumn()
        createdAt: Date;
    
        @UpdateDateColumn()
        updatedAt: Date;
}
