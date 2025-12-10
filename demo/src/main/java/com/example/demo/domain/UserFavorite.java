package com.example.demo.domain;

import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Column;
import org.springframework.data.relational.core.mapping.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("user_favorites")
public class UserFavorite {
    @Id
    private Long id;
    
    @Column("user_id")
    private Long userId;
    
    @Column("book_id")
    private Integer bookId;
    
    @Column("book_title")
    private String bookTitle;
    
    @Column("author_name")
    private String authorName;
    
    @Column("created_at")
    private LocalDateTime createdAt;
}