//
//  ActivityTableCell.h
//  Activities
//
//  Created by Owen Campbell-Moore on 27/07/2013.
//  Copyright (c) 2013 A&O. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface ActivityTableCell : UITableViewCell

@property (nonatomic, weak) IBOutlet UILabel *activityLabel;
@property (weak, nonatomic) IBOutlet UIButton *tapAlongButton;
@property (weak, nonatomic) IBOutlet UIImageView *cardBackgroundView;
@property (weak, nonatomic) IBOutlet UIImageView *divider;
@property (weak, nonatomic) IBOutlet UIImageView *userImage;

-(void)refreshLayout;

@end
